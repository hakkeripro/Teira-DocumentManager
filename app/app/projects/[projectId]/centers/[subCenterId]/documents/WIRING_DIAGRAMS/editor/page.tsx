import { notFound } from 'next/navigation';
import type { DocumentType } from '@prisma/client';
import { requireActor } from '@/lib/actor';
import { db } from '@/lib/db';
import { readCanonical } from '@/lib/canonical';
import { canWrite } from '@/lib/permissions';
import { deriveWiringV2View } from '@/lib/wiringEditorV2';
import WiringEditorV2Client from '@/components/WiringEditorV2Client';

export default async function WiringDiagramEditorPage({
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

  const doc = await db.document.upsert({
    where: { subCenterId_type: { subCenterId: center.id, type: 'WIRING_DIAGRAMS' as DocumentType } },
    update: { companyId: actor.companyId, projectId: project.id },
    create: {
      companyId: actor.companyId,
      projectId: project.id,
      subCenterId: center.id,
      type: 'WIRING_DIAGRAMS' as DocumentType,
      title: 'Wiring diagrams',
    },
  });

  const canon = doc.settings ? readCanonical(doc.settings) : null;
  const rows = canon?.rows ?? [];

  const initialState = deriveWiringV2View({
    settings: doc.settings ?? null,
    canonicalRows: rows,
  });

  return (
    <WiringEditorV2Client
      projectId={project.id}
      subCenterId={center.id}
      canWrite={canWrite(actor.role)}
      initialState={initialState}
      canonicalRows={rows}
    />
  );
}
