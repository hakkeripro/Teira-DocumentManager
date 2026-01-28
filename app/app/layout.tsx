import type { Metadata } from 'next';
import { requireActor } from '@/lib/actor';
import { Sidebar } from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'TEIRA – App',
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireActor();

  return (
    <div className="shell">
      <input id="global-nav-toggle" className="global-nav-toggle" type="checkbox" />
      <Sidebar actor={actor} />
      <label className="global-nav-overlay" htmlFor="global-nav-toggle" aria-hidden="true" />
      <main className="main">
        <div className="global-topbar">
          <label className="btn secondary global-nav-button" htmlFor="global-nav-toggle">
            ☰ Menu
          </label>
        </div>
        {children}
      </main>
    </div>
  );
}
