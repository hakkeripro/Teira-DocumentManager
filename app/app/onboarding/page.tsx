import { db } from '@/lib/db';
import { requireSignedIn } from '@/lib/actor';
import { redirect } from 'next/navigation';

export default async function OnboardingPage() {
  const authUser = await requireSignedIn();

  const existing = await db.appUser.findUnique({ where: { authUserId: authUser.id } });
  if (existing) redirect('/app/areas');

  async function createTenant(formData: FormData) {
    'use server';
    const auth = await requireSignedIn();
    const name = String(formData.get('companyName') ?? '').trim();
    const displayName = String(formData.get('displayName') ?? '').trim();
    if (!name) throw new Error('Company name is required');

    const already = await db.appUser.findUnique({ where: { authUserId: auth.id } });
    if (already) redirect('/app/areas');

    const company = await db.company.create({ data: { name } });
    await db.appUser.create({
      data: {
        companyId: company.id,
        authUserId: auth.id,
        email: auth.email ?? '',
        name: displayName || null,
        role: 'ADMIN',
      },
    });

    redirect('/app/areas');
  }

  return (
    <div className="page">
      <h1>Welcome to TEIRA</h1>
      <p className="muted">Create your company (tenant) to get started.</p>

      <form className="card" action={createTenant}>
        <label className="label">
          Company name
          <input className="input" name="companyName" placeholder="Example Oy" required />
        </label>

        <label className="label">
          Your name (optional)
          <input className="input" name="displayName" placeholder="Jane Doe" />
        </label>

        <button className="btn" type="submit">Create tenant</button>
      </form>

      <div className="muted small">Signed in as: {authUser.email}</div>
    </div>
  );
}
