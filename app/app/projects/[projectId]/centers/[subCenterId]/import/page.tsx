import { notFound } from 'next/navigation';
import { requireActor } from '@/lib/actor';
import { db } from '@/lib/db';
import { DOCUMENT_TYPES, docLabel } from '@/lib/docTypes';
import { canWrite } from '@/lib/permissions';
import { ImportExportClient } from '@/components/ImportExportClient';
import type { DocumentType } from '@prisma/client';

export default async function CenterImportExportPage({
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

  const docTypes = DOCUMENT_TYPES.map((d) => ({
    type: d.type as DocumentType,
    label: docLabel(d.type),
  }));

  return (
    <div className="page" style={{ display: 'grid', gap: 12 }}>
      <div className="card">
        <h2 className="h2">Import / Export</h2>
        <div className="muted small">
          Project <span className="mono">{project.code}</span> · Center <span className="mono">{center.code ?? center.id}</span>
        </div>
      </div>

      <ImportExportClient
        projectId={project.id}
        subCenterId={center.id}
        canWrite={canWrite(actor.role)}
        docTypes={docTypes}
      />

      <div className="card">
        <h2 className="h2">Audit</h2>
        <div className="row">
          <a className="btn secondary" href={`/app/projects/${project.id}/centers/${center.id}/imports`}>
            View import runs
          </a>
        </div>
      </div>
    </div>
  );
}
