import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireActor } from '@/lib/actor';
import { db } from '@/lib/db';

function fmtDate(d: Date) {
  return d.toISOString().replace('T', ' ').slice(0, 16);
}

export default async function CenterImportRunsPage({
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

  const jobs = await db.importJob.findMany({
    where: { companyId: actor.companyId, projectId: project.id, subCenterId: center.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { createdBy: true },
  });

  return (
    <div className="card">
      <div className="row spaceBetween">
        <div>
          <h2 className="h2">Import runs</h2>
          <div className="muted small">
            {project.area.name} / {project.code} — {project.name} · Center: {center.code ?? '—'}
          </div>
        </div>
        <div className="row">
          <Link className="btn secondary" href={`/app/projects/${project.id}/centers/${center.id}/import`}>
            Import / Export
          </Link>
        </div>
      </div>

      <div className="hr" />

      {jobs.length === 0 ? (
        <div className="muted">No import runs yet.</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Created</th>
              <th>Status</th>
              <th>User</th>
              <th>Source</th>
              <th>DocType</th>
              <th>Created</th>
              <th>Updated</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => {
              const s = (j.summary && typeof j.summary === 'object' && !Array.isArray(j.summary)) ? (j.summary as Record<string, unknown>) : {};
              return (
                <tr key={j.id}>
                  <td className="mono">{fmtDate(j.createdAt)}</td>
                  <td>
                    <span className="badge">{j.status}</span>
                  </td>
                  <td className="muted small">{j.createdBy?.email ?? '—'}</td>
                  <td className="muted small">{j.source} · {j.filename}</td>
                  <td className="mono small">{String(s['docType'] ?? '—')}</td>
                  <td className="mono">{Number(s['createdCount'] ?? 0)}</td>
                  <td className="mono">{Number(s['updatedCount'] ?? 0)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <Link className="btn secondary" href={`/app/projects/${project.id}/centers/${center.id}/imports/${j.id}`}>
                      Details
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
