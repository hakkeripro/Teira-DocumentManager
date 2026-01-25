import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requireActor } from '@/lib/actor';
import { assertWrite, canWrite } from '@/lib/permissions';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export default async function AreaPage({ params }: { params: Promise<{ areaId: string }> }) {
  const { areaId } = await params;

  const actor = await requireActor();
  const area = await db.area.findFirst({
    where: { id: areaId, companyId: actor.companyId },
  });
  if (!area) return notFound();

  const projects = await db.project.findMany({
    where: { areaId: area.id, companyId: actor.companyId },
    orderBy: { createdAt: 'asc' },
  });

  async function createProject(formData: FormData) {
    'use server';
    const a = await requireActor();
    assertWrite(a.role);

    const name = String(formData.get('name') ?? '').trim();
    const code = String(formData.get('code') ?? '').trim().toUpperCase();
    const areaId = String(formData.get('areaId') ?? '');
    if (!name) throw new Error('Name required');
    if (!code) throw new Error('Code required');

    const area = await db.area.findFirst({ where: { id: areaId, companyId: a.companyId } });
    if (!area) throw new Error('Invalid area');

    const project = await db.project.create({
      data: {
        companyId: a.companyId,
        areaId: area.id,
        name,
        code,
      },
    });

    // Create a default center (konteksti) for the project
    const center = await db.subCenter.create({
      data: {
        companyId: a.companyId,
        projectId: project.id,
        name: 'Main',
        code: 'MAIN',
        sortOrder: 0,
      },
    });

    revalidatePath(`/app/areas/${area.id}`);
    redirect(`/app/projects/${project.id}/centers/${center.id}/documents`);
  }

  return (
    <div className="page">
      <div className="row spaceBetween">
        <div>
          <h1>{area.name}</h1>
          <div className="muted">Area ID: {area.id}</div>
        </div>
        <Link className="btn secondary" href="/app/areas">Back</Link>
      </div>

      <form className="card" action={createProject}>
        <h2 className="h2">Create project</h2>
        <input type="hidden" name="areaId" value={area.id} />

        <label className="label">
          Project code
          <input className="input" name="code" placeholder="XXX" disabled={!canWrite(actor.role)} required />
        </label>

        <label className="label">
          Project name
          <input className="input" name="name" placeholder="Customer site" disabled={!canWrite(actor.role)} required />
        </label>

        <button className="btn" type="submit" disabled={!canWrite(actor.role)}>
          Create project
        </button>
        {!canWrite(actor.role) && <div className="muted small">You have VIEWER role. Creating is disabled.</div>}
      </form>

      <div className="card">
        <h2 className="h2">Projects</h2>
        {projects.length == 0 ? (
          <div className="muted">No projects yet.</div>
        ) : (
          <ul className="list">
            {projects.map((p) => (
              <li key={p.id} className="listItem">
                <Link className="link" href={`/app/projects/${p.id}`}>
                  {p.code} — {p.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
