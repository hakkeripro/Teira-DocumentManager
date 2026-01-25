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
    const companyName = String(formData.get('companyName') ?? '').trim();
    const userName = String(formData.get('userName') ?? '').trim();

    if (!companyName) throw new Error('Company name is required');

    const company = await db.company.create({
      data: { name: companyName },
      select: { id: true },
    });

    await db.appUser.create({
      data: {
        authUserId: auth.id,
        companyId: company.id,
        email: auth.email ?? '',
        // Prisma field is `name` (nullable). Previously used `displayName` (not in schema).
        name: userName || null,
        role: 'ADMIN',
      },
    });

    redirect('/app/areas');
  }

  return (
    <div style={{ maxWidth: 520, margin: '40px auto', padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Create tenant</h1>
      <p style={{ marginTop: 0, color: '#555' }}>
        Create your company workspace. You will become ADMIN for this tenant.
      </p>

      <form action={createTenant} style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Company name</span>
          <input
            name="companyName"
            required
            placeholder="Acme Oy"
            style={{ padding: 10, borderRadius: 8, border: '1px solid #ddd' }}
          />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>Your name (optional)</span>
          <input
            name="userName"
            placeholder="Jane Doe"
            style={{ padding: 10, borderRadius: 8, border: '1px solid #ddd' }}
          />
        </label>

        <button
          type="submit"
          style={{
            padding: 10,
            borderRadius: 8,
            border: '1px solid #111',
            background: '#111',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          Create tenant
        </button>
      </form>

      <div style={{ marginTop: 18, color: '#666', fontSize: 13 }}>Signed in as: {authUser.email}</div>
    </div>
  );
}
