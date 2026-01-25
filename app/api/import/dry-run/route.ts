import { NextResponse } from 'next/server';
import type { DocumentType } from '@prisma/client';
import { requireActorApi } from '@/lib/actorApi';
import { db } from '@/lib/db';
import { loadMappingSpecFromRepo } from '@/lib/mapping/loadSpec';
import { findTarget, parseXlsxToCanonical, parseXmlToCanonical } from '@/lib/mapping/engine';
import { readCanonical, upsertByIdentity } from '@/lib/canonical';

function toError(e: unknown): { status: number; message: string } {
  if (e && typeof e === 'object') {
    const status = (e as Record<string, unknown>)['statusCode'];
    const msg = (e as Record<string, unknown>)['message'];
    if (typeof status === 'number' && typeof msg === 'string') return { status, message: msg };
  }
  if (e instanceof Error) return { status: 500, message: e.message };
  return { status: 500, message: 'Error' };
}

export async function POST(req: Request) {
  try {
    const actor = await requireActorApi();
    const form = await req.formData();

    const projectId = String(form.get('projectId') ?? '');
    const subCenterId = String(form.get('subCenterId') ?? '');
    const docType = String(form.get('docType') ?? '');
    const file = form.get('file');

    if (!projectId || !subCenterId || !docType) {
      return new NextResponse('Missing parameters', { status: 400 });
    }
    if (!(file instanceof File)) {
      return new NextResponse('Missing file', { status: 400 });
    }

    const project = await db.project.findFirst({ where: { id: projectId, companyId: actor.companyId } });
    if (!project) return new NextResponse('Project not found', { status: 404 });

    const center = await db.subCenter.findFirst({ where: { id: subCenterId, projectId: projectId, companyId: actor.companyId } });
    if (!center) return new NextResponse('Center not found', { status: 404 });

    const spec = await loadMappingSpecFromRepo();
    const target = findTarget(spec, docType);
    if (!target) return new NextResponse('Unknown docType', { status: 400 });

    const ab = await file.arrayBuffer();
    const buf = Buffer.from(new Uint8Array(ab));
    const name = file.name ?? 'upload';
    const ext = String(name).toLowerCase().split('.').pop() ?? '';

    if (ext !== 'xml' && ext !== 'xlsx') {
      return new NextResponse('Unsupported file type. Use .xml or .xlsx', { status: 400 });
    }

    const contextHeader = {
      project_code: project.code,
      center_code: center.code,
      center_name: center.name,
    };

    const engineRes = ext === 'xml'
      ? parseXmlToCanonical({ spec, target, fileBuffer: buf, contextHeader })
      : await parseXlsxToCanonical({ spec, target, fileBuffer: buf, contextHeader });

    const docTypeEnum = target.docType as DocumentType;

    // Compute would-create / would-update
    const existingDoc = await db.document.findFirst({
      where: { companyId: actor.companyId, projectId, subCenterId, type: docTypeEnum },
    });
    const existingCanon = existingDoc ? readCanonical(existingDoc.settings) : null;
    const merged = upsertByIdentity({
      existingRows: existingCanon?.rows ?? [],
      incomingRows: engineRes.canonical.rows,
      identityKeys: engineRes.canonical.identityKeys,
    });

    const errorsCount = engineRes.issues.filter((i) => i.severity === 'ERROR').length;
    const warningsCount = engineRes.issues.filter((i) => i.severity === 'WARN').length;

    return NextResponse.json({
      ok: errorsCount === 0,
      source: ext === 'xml' ? 'XML' : 'XLSX',
      filename: name,
      docType,
      rowCount: engineRes.canonical.rows.length,
      wouldCreate: merged.created,
      wouldUpdate: merged.updated,
      issues: engineRes.issues,
      warningsCount,
      errorsCount,
      sampleRows: engineRes.canonical.rows.slice(0, 10),
      identityKeys: engineRes.canonical.identityKeys,
    });
  } catch (e: unknown) {
    const { status, message } = toError(e);
    return new NextResponse(message, { status });
  }
}
