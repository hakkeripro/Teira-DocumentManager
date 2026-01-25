import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireActor } from '@/lib/actor';
import { db } from '@/lib/db';

function fmtDate(d: Date) {
  return d.toISOString().replace('T', ' ').slice(0, 16);
}

export default async function ImportRunDetailsPage({
  params,
}: {
  params: Promise<{ projectId: string; subCenterId: string; jobId: string }>;
}) {
  const { projectId, subCenterId, jobId } = await params;
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

  const job = await db.importJob.findFirst({
    where: { id: jobId, companyId: actor.companyId, projectId: project.id, subCenterId: center.id },
    include: {
      createdBy: true,
      // ImportIssue does not have createdAt in v1.2 data model.
      // Keep ordering stable for UI.
      issues: { orderBy: { id: 'asc' } },
    },
  });
  if (!job) return notFound();

  const summary = (job.summary && typeof job.summary === 'object' && !Array.isArray(job.summary)) ? (job.summary as Record<string, unknown>) : {};
  const docId = summary['documentId'] ? String(summary['documentId']) : null;
  const doc = docId
    ? await db.document.findFirst({ where: { id: docId, companyId: actor.companyId } })
    : null;

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="card">
        <div className="row spaceBetween">
          <div>
            <h2 className="h2">Import run details</h2>
            <div className="muted small">
              {project.area.name} / {project.code} — {project.name} · Center: {center.code ?? '—'}
            </div>
          </div>
          <div className="row">
            <Link className="btn secondary" href={`/app/projects/${project.id}/centers/${center.id}/imports`}>
              Back
            </Link>
            <Link className="btn secondary" href={`/app/projects/${project.id}/centers/${center.id}/import`}>
              Import / Export
            </Link>
          </div>
        </div>

        <div className="hr" />

        <div className="row" style={{ gap: 10 }}>
          <span className="badge">{job.status}</span>
          <span className="muted small">
            {job.source} · {job.filename} · {fmtDate(job.createdAt)}
          </span>
          <span className="muted small">User: {job.createdBy?.email ?? '—'}</span>
        </div>

        <div className="hr" />

        <div className="row" style={{ gap: 18 }}>
          <div>
            <div className="muted small">DocType</div>
            <div className="mono">{String(summary['docType'] ?? '—')}</div>
          </div>
          <div>
            <div className="muted small">Rows</div>
            <div className="mono">{Number(summary['rowCount'] ?? 0)}</div>
          </div>
          <div>
            <div className="muted small">Created</div>
            <div className="mono">{Number(summary['createdCount'] ?? 0)}</div>
          </div>
          <div>
            <div className="muted small">Updated</div>
            <div className="mono">{Number(summary['updatedCount'] ?? 0)}</div>
          </div>
          <div>
            <div className="muted small">Warnings</div>
            <div className="mono">{Number(summary['warningsCount'] ?? 0)}</div>
          </div>
          <div>
            <div className="muted small">Errors</div>
            <div className="mono">{Number(summary['errorsCount'] ?? 0)}</div>
          </div>
        </div>

        {doc ? (
          <div className="row" style={{ marginTop: 12 }}>
            <Link className="btn secondary" href={`/app/projects/${project.id}/centers/${center.id}/documents/${doc.type}`}>
              Open document
            </Link>
          </div>
        ) : null}

        <div style={{ marginTop: 12 }}>
          <div className="muted small">Summary JSON</div>
          <pre className="mono small">{JSON.stringify(summary, null, 2)}</pre>
        </div>
      </div>

      <div className="card">
        <h2 className="h2">Issues</h2>
        {job.issues.length === 0 ? (
          <div className="muted">No issues recorded.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>Message</th>
                <th>Path</th>
              </tr>
            </thead>
            <tbody>
              {job.issues.map((i) => (
                <tr key={i.id}>
                  <td>
                    <span className="badge">{i.severity}</span>
                  </td>
                  <td>{i.message}</td>
                  <td className="mono small">{i.path ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
