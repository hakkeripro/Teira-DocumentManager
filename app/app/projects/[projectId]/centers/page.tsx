import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireActor } from '@/lib/actor';
import { assertWrite, canWrite } from '@/lib/permissions';

export default async function CentersPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const actor = await requireActor();

  const project = await db.project.findFirst({
    where: { id: projectId, companyId: actor.companyId },
    include: { area: true },
  });
  if (!project) return notFound();

  const centers = await db.subCenter.findMany({
    where: { projectId: project.id, companyId: actor.companyId },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });

  async function createCenter(formData: FormData) {
    'use server';
    const a = await requireActor();
    assertWrite(a.role);

    const projectId = String(formData.get('projectId') ?? '');
    const name = String(formData.get('name') ?? '').trim();
    const codeRaw = String(formData.get('code') ?? '').trim();
    const code = codeRaw ? codeRaw.toUpperCase() : null;
    if (!projectId) throw new Error('Missing projectId');
    if (!name) throw new Error('Name required');

    const project = await db.project.findFirst({ where: { id: projectId, companyId: a.companyId } });
    if (!project) throw new Error('Invalid project');

    const created = await db.subCenter.create({
      data: {
        companyId: a.companyId,
        projectId: project.id,
        name,
        code,
        sortOrder: 0,
      },
    });

    revalidatePath(`/app/projects/${project.id}/centers`);
    redirect(`/app/projects/${project.id}/centers/${created.id}/documents`);
  }

  return (
    <div className="page">
      <div className="row spaceBetween">
        <div>
          <h1>Centers</h1>
          <div className="muted">
            {project.area.name} / {project.code} — {project.name}
          </div>
        </div>
        <Link className="btn secondary" href={`/app/areas/${project.areaId}`}>
          Back to area
        </Link>
      </div>

      <form className="card" action={createCenter}>
        <h2 className="h2">Create center</h2>
        <input type="hidden" name="projectId" value={project.id} />

        <label className="label">
          Center code (optional)
          <input className="input" name="code" placeholder="CENTER" disabled={!canWrite(actor.role)} />
        </label>
        <label className="label">
          Center name
          <input className="input" name="name" placeholder="Main" required disabled={!canWrite(actor.role)} />
        </label>
        <button className="btn" type="submit" disabled={!canWrite(actor.role)}>
          Create center
        </button>
        {!canWrite(actor.role) && <div className="muted small">You have VIEWER role. Creating is disabled.</div>}
      </form>

      <div className="card">
        <h2 className="h2">Existing centers</h2>
        {centers.length === 0 ? (
          <div className="muted">No centers yet.</div>
        ) : (
          <ul className="list">
            {centers.map((c) => (
              <li key={c.id} className="listItem">
                <Link className="link" href={`/app/projects/${project.id}/centers/${c.id}/documents`}>
                  {c.code ?? '—'} — {c.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
