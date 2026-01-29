import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requireActor } from '@/lib/actor';

export default async function CenterLayout({
  params,
  children,
}: {
  params: Promise<{ projectId: string; subCenterId: string }>;
  children: React.ReactNode;
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

  return (
    <div className="page">
      <div className="row spaceBetween center-shell-header">
        <div>
          <h1>
            {center.code ?? '—'} — {center.name}
          </h1>
          <div className="muted">
            {project.area.name} / {project.code} — {project.name}
          </div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <Link className="btn secondary" href={`/app/projects/${project.id}/centers`}>
            Centers
          </Link>
          <Link className="btn secondary" href={`/app/areas/${project.areaId}`}>
            Area
          </Link>
        </div>
      </div>

      <div className="card center-shell-nav" style={{ padding: 12 }}>
        <div className="row" style={{ gap: 12 }}>
          <Link className="link" href={`/app/projects/${project.id}/centers/${center.id}/documents`}>
            Documents
          </Link>
          <Link className="link" href={`/app/projects/${project.id}/centers/${center.id}/import`}>
            Import / Export
          </Link>
          <Link className="link" href={`/app/projects/${project.id}/centers/${center.id}/imports`}>
            Import audit
          </Link>
        </div>
      </div>

      {children}
    </div>
  );
}
