import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireActor } from '@/lib/actor';
import { db } from '@/lib/db';
import { DOCUMENT_TYPES, docLabel } from '@/lib/docTypes';
import { readCanonical } from '@/lib/canonical';

function fmtDate(d: Date) {
  return d.toISOString().replace('T', ' ').slice(0, 16);
}

export default async function CenterDocumentsPage({
  params,
}: {
  params: Promise<{ projectId: string; subCenterId: string }>;
}) {
  const { projectId, subCenterId } = await params;
  const actor = await requireActor();

  const project = await db.project.findFirst({
    where: { id: projectId, companyId: actor.companyId },
    include: { area: true },
  });
  if (!project) return notFound();

  const center = await db.subCenter.findFirst({
    where: { id: subCenterId, projectId: project.id, companyId: actor.companyId },
  });
  if (!center) return notFound();

  const documents = await db.document.findMany({
    where: { companyId: actor.companyId, projectId: project.id, subCenterId: center.id },
    include: {
      revisions: { orderBy: { revIndex: 'desc' }, take: 1 },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const byType = new Map(documents.map((d) => [d.type, d] as const));

  return (
    <div className="card">
      <h2 className="h2">Documents</h2>
      <div className="muted small">
        Center-scoped documents. Import creates/updates canonical rows; Publish creates a PDF revision.
      </div>

      <div className="hr" />

      <table className="table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Rows</th>
            <th>Updated</th>
            <th>Latest revision</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {DOCUMENT_TYPES.map((t) => {
            const doc = byType.get(t.type);
            const canon = doc?.settings ? readCanonical(doc.settings) : null;
            const rowCount = canon?.rows?.length ?? 0;
            const latest = doc?.revisions?.[0] ?? null;
            return (
              <tr key={t.type}>
                <td>{docLabel(t.type)}</td>
                <td>{rowCount}</td>
                <td>{doc ? fmtDate(doc.updatedAt) : '—'}</td>
                <td>
                  {latest ? (
                    <span className="badge">
                      {latest.revLetter} · {fmtDate(latest.createdAt)}
                    </span>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <Link
                    className="btn secondary"
                    href={`/app/projects/${project.id}/centers/${center.id}/documents/${t.type}`}
                  >
                    Open
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="hr" />

      <div className="muted small">
        Project: <span className="mono">{project.code}</span> · Center:{' '}
        <span className="mono">{center.code ?? center.id}</span>
      </div>
    </div>
  );
}
