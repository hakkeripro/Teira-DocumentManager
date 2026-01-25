import { NextResponse } from 'next/server';
import type { DocumentType, ImportSource } from '@prisma/client';
import { requireActorApi } from '@/lib/actorApi';
import { db } from '@/lib/db';
import { assertWrite } from '@/lib/permissions';
import { loadMappingSpecFromRepo } from '@/lib/mapping/loadSpec';
import { findTarget, parseXlsxToCanonical, parseXmlToCanonical } from '@/lib/mapping/engine';
import { readCanonical, upsertByIdentity, type CanonicalDocument } from '@/lib/canonical';
import { mergeSettingsWithCanonical } from '@/lib/wiringEditor';

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
    assertWrite(actor.role);
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

    const name = file.name ?? 'upload';
    const ext = String(name).toLowerCase().split('.').pop() ?? '';

    if (ext !== 'xml' && ext !== 'xlsx') {
      return new NextResponse('Unsupported file type. Use .xml or .xlsx', { status: 400 });
    }

    const source: ImportSource = ext === 'xml' ? 'XML' : 'XLSX';

    // Create job early for audit trail
    const job = await db.importJob.create({
      data: {
        companyId: actor.companyId,
        projectId,
        subCenterId,
        source,
        filename: name,
        createdByUserId: actor.appUserId,
        status: 'PENDING',
      },
    });

    const ab = await file.arrayBuffer();
    const buf = Buffer.from(new Uint8Array(ab));

    const contextHeader = {
      project_code: project.code,
      center_code: center.code,
      center_name: center.name,
    };

    const engineRes = ext === 'xml'
      ? parseXmlToCanonical({ spec, target, fileBuffer: buf, contextHeader })
      : await parseXlsxToCanonical({ spec, target, fileBuffer: buf, contextHeader });

    const errors = engineRes.issues.filter((i) => i.severity === 'ERROR');
    const warns = engineRes.issues.filter((i) => i.severity === 'WARN');

    // Persist issues
    if (engineRes.issues.length > 0) {
      await db.importIssue.createMany({
        data: engineRes.issues.map((i) => ({
          companyId: actor.companyId,
          importJobId: job.id,
          severity: i.severity,
          message: i.message,
          path: i.path,
        })),
      });
    }

    const docTypeEnum = target.docType as DocumentType;

    if (errors.length > 0) {
      await db.importJob.update({
        where: { id: job.id },
        data: {
          status: 'FAILED',
          summary: {
            docType: docTypeEnum,
            source,
            filename: name,
            rowCount: engineRes.canonical.rows.length,
            createdCount: 0,
            updatedCount: 0,
            warningsCount: warns.length,
            errorsCount: errors.length,
          },
        },
      });
      return NextResponse.json({ ok: false, jobId: job.id, errors: engineRes.issues });
    }

    // Load existing doc + merge
    const existingDoc = await db.document.findFirst({
      where: { companyId: actor.companyId, projectId, subCenterId, type: docTypeEnum },
    });

    const existingCanon = existingDoc ? readCanonical(existingDoc.settings) : null;
    const merged = upsertByIdentity({
      existingRows: existingCanon?.rows ?? [],
      incomingRows: engineRes.canonical.rows,
      identityKeys: engineRes.canonical.identityKeys,
    });

    const nextCanon: CanonicalDocument = {
      version: 1,
      updatedAt: new Date().toISOString(),
      docType: docTypeEnum,
      identityKeys: engineRes.canonical.identityKeys,
      header: engineRes.canonical.header,
      rows: merged.merged,
    };

    // IMPORTANT (Sprint 3): preserve any existing document.settings_jsonb keys
    // (e.g. editor state) when updating canonical.
    const canonicalPayload = {
      version: nextCanon.version,
      updatedAt: nextCanon.updatedAt,
      docType: nextCanon.docType,
      identityKeys: nextCanon.identityKeys,
      header: nextCanon.header,
      rows: nextCanon.rows,
    };

    const document = await db.document.upsert({
      where: {
        subCenterId_type: {
          subCenterId,
          type: docTypeEnum,
        },
      },
      update: {
        companyId: actor.companyId,
        projectId,
        settings: mergeSettingsWithCanonical({ settings: existingDoc?.settings, canonical: canonicalPayload }),
      },
      create: {
        companyId: actor.companyId,
        projectId,
        subCenterId,
        type: docTypeEnum,
        settings: mergeSettingsWithCanonical({ settings: null, canonical: canonicalPayload }),
      },
    });

    await db.importJob.update({
      where: { id: job.id },
      data: {
        status: 'SUCCESS',
        summary: {
          docType: docTypeEnum,
          source,
          filename: name,
          rowCount: engineRes.canonical.rows.length,
          createdCount: merged.created,
          updatedCount: merged.updated,
          warningsCount: warns.length,
          errorsCount: 0,
          documentId: document.id,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      jobId: job.id,
      documentId: document.id,
      created: merged.created,
      updated: merged.updated,
      warnings: warns.length,
    });
  } catch (e: unknown) {
    const { status, message } = toError(e);
    return new NextResponse(message, { status });
  }
}
