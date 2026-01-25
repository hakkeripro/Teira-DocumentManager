import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import type { DocumentType } from '@prisma/client';
import { requireActor } from '@/lib/actor';
import { db } from '@/lib/db';
import { assertWrite, canWrite } from '@/lib/permissions';
import { DOCUMENT_TYPES, docLabel, revDisplay } from '@/lib/docTypes';
import { readCanonical } from '@/lib/canonical';
import { loadMappingSpecFromRepo } from '@/lib/mapping/loadSpec';
import { findTarget } from '@/lib/mapping/engine';
import { generatePlaceholderPdf } from '@/lib/pdf';
import { getStorage } from '@/lib/storage';

function fmtDate(d: Date) {
  return d.toISOString().replace('T', ' ').slice(0, 16);
}

function revLetterFromIndex(i: number): string {
  if (i < 0 || i > 25) throw new Error('Revision index out of range (A-Z)');
  return String.fromCharCode('A'.charCodeAt(0) + i);
}

function safeKey(s: string) {
  return s.replace(/[^a-zA-Z0-9._/-]/g, '_');
}

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ projectId: string; subCenterId: string; docType: string }>;
}) {
  const { projectId, subCenterId, docType } = await params;
  const actor = await requireActor();

  const isValidType = DOCUMENT_TYPES.some((d) => d.type === (docType as DocumentType));
  if (!isValidType) return notFound();

  // WIRING_DIAGRAMS is edited exclusively via the page-model editor (Editor v2).
  // The canonical view is still available via Import/Export and APIs, but the primary UI
  // entry point must be the editor to match the print-layout workflow.
  if (docType === 'WIRING_DIAGRAMS') {
    redirect(`/app/projects/${projectId}/centers/${subCenterId}/documents/WIRING_DIAGRAMS/editor`);
  }

  // Derived lists are edited via their own editors (they still export canonical rows).
  if (docType === 'NAMEPLATE_LIST') {
    redirect(`/app/projects/${projectId}/centers/${subCenterId}/documents/NAMEPLATE_LIST/editor`);
  }

  const project = await db.project.findFirst({
    where: { id: projectId, companyId: actor.companyId },
    include: { area: true },
  });
  if (!project) return notFound();

  const center = await db.subCenter.findFirst({
    where: { id: subCenterId, projectId: project.id, companyId: actor.companyId },
  });
  if (!center) return notFound();

  const spec = await loadMappingSpecFromRepo();
  const target = findTarget(spec, docType);
  if (!target) return notFound();

  // Ensure document exists
  const document = await db.document.upsert({
    where: {
      subCenterId_type: {
        subCenterId: center.id,
        type: docType as DocumentType,
      },
    },
    update: {
      companyId: actor.companyId,
      projectId: project.id,
    },
    create: {
      companyId: actor.companyId,
      projectId: project.id,
      subCenterId: center.id,
      type: docType as DocumentType,
      title: docLabel(docType as DocumentType),
    },
  });

  const revisions = await db.documentRevision.findMany({
    where: { companyId: actor.companyId, documentId: document.id },
    orderBy: { revIndex: 'desc' },
    include: {
      createdBy: true,
      assets: { where: { assetType: 'PDF' } },
    },
  });

  const canon = document.settings ? readCanonical(document.settings) : null;
  const rows = canon?.rows ?? [];

  async function publish(formData: FormData) {
    'use server';
    const a = await requireActor();
    assertWrite(a.role);

    const projectId = String(formData.get('projectId') ?? '');
    const subCenterId = String(formData.get('subCenterId') ?? '');
    const docType = String(formData.get('docType') ?? '');
    const changeNote = String(formData.get('changeNote') ?? '').trim();

    const proj = await db.project.findFirst({ where: { id: projectId, companyId: a.companyId } });
    if (!proj) throw new Error('Project not found');

    const sc = await db.subCenter.findFirst({ where: { id: subCenterId, projectId: proj.id, companyId: a.companyId } });
    if (!sc) throw new Error('Center not found');

    const doc = await db.document.findFirst({
      where: { companyId: a.companyId, projectId: proj.id, subCenterId: sc.id, type: docType as DocumentType },
    });
    if (!doc) throw new Error('Document not found');

    const last = await db.documentRevision.findFirst({
      where: { companyId: a.companyId, documentId: doc.id },
      orderBy: { revIndex: 'desc' },
    });

    const nextIndex = (last?.revIndex ?? -1) + 1;
    const revLetter = revLetterFromIndex(nextIndex);

    const revision = await db.documentRevision.create({
      data: {
        companyId: a.companyId,
        documentId: doc.id,
        revIndex: nextIndex,
        revLetter,
        changeNote: changeNote || null,
        createdByUserId: a.appUserId,
      },
    });

    const pdfBytes = await generatePlaceholderPdf({
      title: doc.title || docLabel(docType as DocumentType),
      projectCode: proj.code,
      documentTypeLabel: docLabel(docType as DocumentType),
      revisionDisplay: revDisplay(revLetter, proj.code),
    });

    const storage = getStorage();
    const key = safeKey(
      `pdf/${a.companyId}/${proj.code}/${sc.code ?? sc.id}/${docType}/${revLetter}-${proj.code}-${revision.id}.pdf`,
    );
    const put = await storage.putPdf(key, pdfBytes);

    await db.documentRevisionAsset.create({
      data: {
        companyId: a.companyId,
        documentRevisionId: revision.id,
        assetType: 'PDF',
        storageProvider: put.provider,
        storageKey: put.key,
      },
    });

    revalidatePath(`/app/projects/${proj.id}/centers/${sc.id}/documents/${docType}`);
    redirect(`/app/projects/${proj.id}/centers/${sc.id}/documents/${docType}`);
  }

  const columns = target.canonical?.row_fields ?? [];

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="card">
        <div className="row spaceBetween">
          <div>
            <h2 className="h2">{docLabel(docType as DocumentType)}</h2>
            <div className="muted small">
              {project.area.name} / {project.code} — {project.name} · Center: {center.code ?? '—'}
            </div>
          </div>
          <div className="row">
            <Link className="btn secondary" href={`/app/projects/${project.id}/centers/${center.id}/documents`}>
              Back
            </Link>
          </div>
        </div>

        <div className="row" style={{ gap: 10, marginTop: 10 }}>
          <Link className="btn secondary" href={`/app/projects/${project.id}/centers/${center.id}/import`}>
            Import / Export
          </Link>
          {docType === 'WIRING_DIAGRAMS' ? (
            <Link
              className="btn"
              href={`/app/projects/${project.id}/centers/${center.id}/documents/WIRING_DIAGRAMS/editor`}
            >
              Open editor
            </Link>
          ) : null}
          <a
            className="btn secondary"
            href={`/api/export?projectId=${project.id}&subCenterId=${center.id}&docType=${docType}&format=xlsx`}
          >
            Export XLSX
          </a>
          <a
            className="btn secondary"
            href={`/api/export?projectId=${project.id}&subCenterId=${center.id}&docType=${docType}&format=xml`}
          >
            Export XML
          </a>
        </div>

        <div className="hr" />

        <div className="row spaceBetween">
          <div className="muted small">
            Canonical rows: <span className="mono">{rows.length}</span> · Last updated:{' '}
            <span className="mono">{fmtDate(document.updatedAt)}</span>
          </div>
          <form action={publish} className="row" style={{ gap: 8 }}>
            <input type="hidden" name="projectId" value={project.id} />
            <input type="hidden" name="subCenterId" value={center.id} />
            <input type="hidden" name="docType" value={docType} />
            <input
              className="input"
              name="changeNote"
              placeholder="Change note (optional)"
              style={{ maxWidth: 320 }}
              disabled={!canWrite(actor.role)}
            />
            <button className="btn" type="submit" disabled={!canWrite(actor.role)}>
              Publish PDF
            </button>
          </form>
        </div>
        {!canWrite(actor.role) && <div className="muted small">You have VIEWER role. Publishing is disabled.</div>}
      </div>

      <div className="card">
        <h2 className="h2">Preview (canonical)</h2>
        {rows.length === 0 ? (
          <div className="muted">No rows yet. Import XML/XLSX from the Import / Export tab.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  {columns.map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                  <th>properties</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 50).map((r, idx: number) => (
                  <tr key={idx}>
                    {columns.map((c) => (
                      <td key={c}>{String(r?.[c] ?? '')}</td>
                    ))}
                    <td className="mono small">{r?.properties ? JSON.stringify(r.properties) : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 50 && <div className="muted small">Showing first 50 rows.</div>}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="h2">Revisions</h2>
        {revisions.length === 0 ? (
          <div className="muted">No revisions yet. Publish to create a PDF revision.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Rev</th>
                <th>Created</th>
                <th>User</th>
                <th>Note</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {revisions.map((r) => (
                <tr key={r.id}>
                  <td>
                    <span className="badge">{revDisplay(r.revLetter, project.code)}</span>
                  </td>
                  <td className="mono">{fmtDate(r.createdAt)}</td>
                  <td className="muted small">{r.createdBy?.email ?? '—'}</td>
                  <td className="muted small">{r.changeNote ?? ''}</td>
                  <td style={{ textAlign: 'right' }}>
                    <a className="btn secondary" href={`/api/revisions/${r.id}/pdf`}>
                      Download PDF
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
