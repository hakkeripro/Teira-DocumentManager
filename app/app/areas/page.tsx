import Link from 'next/link';
import { db } from '@/lib/db';
import { requireActor } from '@/lib/actor';
import { assertWrite, canWrite } from '@/lib/permissions';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export default async function AreasPage() {
  const actor = await requireActor();

  const areas = await db.area.findMany({
    where: { companyId: actor.companyId },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    include: { projects: { orderBy: { createdAt: 'asc' } } },
  });

  async function createArea(formData: FormData) {
    'use server';
    const a = await requireActor();
    assertWrite(a.role);

    const name = String(formData.get('name') ?? '').trim();
    if (!name) throw new Error('Name required');

    const area = await db.area.create({
      data: { companyId: a.companyId, name },
    });

    revalidatePath('/app/areas');
    redirect(`/app/areas/${area.id}`);
  }

  return (
    <div className="page">
      <h1>Areas</h1>
      <p className="muted">Areas group projects. All data is scoped to your company.</p>

      <form className="card" action={createArea}>
        <div className="row">
          <input className="input" name="name" placeholder="New area name" disabled={!canWrite(actor.role)} />
          <button className="btn" type="submit" disabled={!canWrite(actor.role)}>
            Create
          </button>
        </div>
        {!canWrite(actor.role) && <div className="muted small">You have VIEWER role. Creating is disabled.</div>}
      </form>

      <div className="card">
        <h2 className="h2">Existing areas</h2>
        {areas.length === 0 ? (
          <div className="muted">No areas yet. Create one above.</div>
        ) : (
          <ul className="list">
            {areas.map((a) => (
              <li key={a.id} className="listItem">
                <Link href={`/app/areas/${a.id}`} className="link">
                  {a.name}
                </Link>
                <span className="muted small">{a.projects.length} project(s)</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
