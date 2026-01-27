import Link from 'next/link';
import { db } from '@/lib/db';
import type { Actor } from '@/lib/actor';
import { SignOutButton } from '@/components/SignOutButton';

export async function Sidebar({ actor }: { actor: Actor }) {
  const areas = await db.area.findMany({
    where: { companyId: actor.companyId },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    include: {
      projects: {
        orderBy: [{ createdAt: 'asc' }],
        include: {
          subCenters: {
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          },
        },
      },
    },
  });

  return (
    <aside className="sidebar">
      <div className="sidebarHeader">
        <div className="brand">TEIRA</div>
        <div className="muted small">{actor.email}</div>
        <div className="muted small">Role: {actor.role}</div>
        <div className="spacer" />
        <SignOutButton />
      </div>

      <nav className="nav">
        <Link className="navItem" href="/app/areas">
          Areas
        </Link>

        <div className="navSectionTitle">Areas → Projects → Centers</div>
        {areas.length === 0 ? (
          <div className="muted small">No areas yet.</div>
        ) : (
          <ul className="tree">
            {areas.map((a) => (
              <li key={a.id}>
                <details className="treeFolder" open>
                  <summary className="treeSummary">
                    <span className="treeCaret" aria-hidden="true">▾</span>
                    <Link className="treeArea" href={`/app/areas/${a.id}`}>
                      {a.name}
                    </Link>
                  </summary>

                  {a.projects.length > 0 && (
                    <ul className="treeProjects">
                      {a.projects.map((p) => (
                        <li key={p.id}>
                          <details className="treeFolder" open>
                            <summary className="treeSummary">
                              <span className="treeCaret" aria-hidden="true">▾</span>
                              <Link className="treeProject" href={`/app/projects/${p.id}`}>
                                {p.code} — {p.name}
                              </Link>
                            </summary>

                            {p.subCenters.length > 0 && (
                              <ul className="treeProjects">
                                {p.subCenters.map((sc) => (
                                  <li key={sc.id}>
                                    <Link className="treeProject" href={`/app/projects/${p.id}/centers/${sc.id}/documents`}>
                                      {sc.code ?? '—'} — {sc.name}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </details>
                        </li>
                      ))}
                    </ul>
                  )}
                </details>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </aside>
  );
}
