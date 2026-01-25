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
      <Sidebar actor={actor} />
      <main className="main">{children}</main>
    </div>
  );
}
