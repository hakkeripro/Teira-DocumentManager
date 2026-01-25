import { notFound } from 'next/navigation';
import type { DocumentType } from '@prisma/client';
import { requireActor } from '@/lib/actor';
import { db } from '@/lib/db';
import { canWrite } from '@/lib/permissions';
import NameplateListV1Client from '@/components/NameplateListV1Client';
import { readNameplateV1State } from '@/lib/derivedLists/nameplatesV1';
import { deriveNameplateBaseRowsFromWiringV2 } from '@/lib/derivedLists/nameplatesV1.server';

export default async function NameplateListEditorPage({
  params,
}: {
  params: Promise<{ projectId: string; subCenterId: string }>;
}) {
  const { projectId, subCenterId } = await params;
  const actor = await requireActor();

  const project = await db.project.findFirst({ where: { id: projectId, companyId: actor.companyId } });
  if (!project) return notFound();

  const center = await db.subCenter.findFirst({ where: { id: subCenterId, projectId, companyId: actor.companyId } });
  if (!center) return notFound();

  const wiring = await db.document.findFirst({
    where: { companyId: actor.companyId, projectId, subCenterId, type: 'WIRING_DIAGRAMS' as DocumentType },
  });

  const doc = await db.document.upsert({
    where: { subCenterId_type: { subCenterId, type: 'NAMEPLATE_LIST' as DocumentType } },
    update: { companyId: actor.companyId, projectId },
    create: {
      companyId: actor.companyId,
      projectId,
      subCenterId,
      type: 'NAMEPLATE_LIST' as DocumentType,
      title: 'Kilpiluettelo',
    },
  });

  const baseRows = deriveNameplateBaseRowsFromWiringV2({ wiringSettings: wiring?.settings ?? null });
  const state = readNameplateV1State(doc.settings ?? null);

  return (
    <NameplateListV1Client
      projectId={projectId}
      subCenterId={subCenterId}
      canWrite={canWrite(actor.role)}
      initialBaseRows={baseRows}
      initialState={state}
    />
  );
}
