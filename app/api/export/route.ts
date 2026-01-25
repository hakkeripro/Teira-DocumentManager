import { NextResponse } from 'next/server';
import type { DocumentType } from '@prisma/client';
import { requireActorApi } from '@/lib/actorApi';
import { db } from '@/lib/db';
import { loadMappingSpecFromRepo } from '@/lib/mapping/loadSpec';
import { findTarget } from '@/lib/mapping/engine';
import { readCanonical } from '@/lib/canonical';
import { exportCanonicalToXlsx, exportCanonicalToXml } from '@/lib/mapping/export';

function toError(e: unknown): { status: number; message: string } {
  if (e && typeof e === 'object') {
    const status = (e as Record<string, unknown>)['statusCode'];
    const msg = (e as Record<string, unknown>)['message'];
    if (typeof status === 'number' && typeof msg === 'string') return { status, message: msg };
  }
  if (e instanceof Error) return { status: 500, message: e.message };
  return { status: 500, message: 'Error' };
}

function safeFileName(s: string) {
  return s.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function GET(req: Request) {
  try {
    const actor = await requireActorApi();
    const { searchParams } = new URL(req.url);
    const projectId = String(searchParams.get('projectId') ?? '');
    const subCenterId = String(searchParams.get('subCenterId') ?? '');
    const docType = String(searchParams.get('docType') ?? '');
    const format = String(searchParams.get('format') ?? 'xlsx');

    if (!projectId || !subCenterId || !docType) {
      return new NextResponse('Missing parameters', { status: 400 });
    }

    const project = await db.project.findFirst({ where: { id: projectId, companyId: actor.companyId } });
    if (!project) return new NextResponse('Project not found', { status: 404 });

    const center = await db.subCenter.findFirst({ where: { id: subCenterId, projectId, companyId: actor.companyId } });
    if (!center) return new NextResponse('Center not found', { status: 404 });

    const spec = await loadMappingSpecFromRepo();
    const target = findTarget(spec, docType);
    if (!target) return new NextResponse('Unknown docType', { status: 400 });

    const docTypeEnum = target.docType as DocumentType;

    const doc = await db.document.findFirst({ where: { companyId: actor.companyId, projectId, subCenterId, type: docTypeEnum } });
    const canon = doc ? readCanonical(doc.settings) : null;
    const rows = canon?.rows ?? [];

    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const base = safeFileName(`${docType}-${project.code}-${center.code ?? 'CENTER'}-${ts}`);

    if (format === 'xml') {
      const xml = exportCanonicalToXml({
        spec,
        target,
        context: { projectCode: project.code, centerCode: center.code ?? 'CENTER' },
        rows,
      });
      return new NextResponse(xml, {
        headers: {
          'content-type': 'application/xml; charset=utf-8',
          'content-disposition': `attachment; filename="${base}.xml"`,
          'cache-control': 'no-store',
        },
      });
    }

    const u8 = await exportCanonicalToXlsx({ spec, target, header: canon?.header ?? {}, rows });
    // Ensure we pass a real ArrayBuffer (not ArrayBufferLike/SharedArrayBuffer union) to satisfy BodyInit typing.
    const ab = new ArrayBuffer(u8.byteLength);
    new Uint8Array(ab).set(u8);
    return new NextResponse(ab, {
      headers: {
        'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'content-disposition': `attachment; filename="${base}.xlsx"`,
        'cache-control': 'no-store',
      },
    });
  } catch (e: unknown) {
    const { status, message } = toError(e);
    return new NextResponse(message, { status });
  }
}