import { redirect, notFound } from 'next/navigation';
import { requireActor } from '@/lib/actor';
import { db } from '@/lib/db';

export default async function ProjectHome({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  const actor = await requireActor();
  const project = await db.project.findFirst({
    where: { id: projectId, companyId: actor.companyId },
    include: { subCenters: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] } },
  });
  if (!project) return notFound();

  let center = project.subCenters[0];
  if (!center) {
    center = await db.subCenter.create({
      data: {
        companyId: actor.companyId,
        projectId: project.id,
        name: 'Main',
        code: 'MAIN',
        sortOrder: 0,
      },
    });
  }

  redirect(`/app/projects/${projectId}/centers/${center.id}/documents`);
}
