import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import type { Role } from '@prisma/client';

export type Actor = {
  authUserId: string;
  email: string;
  companyId: string;
  appUserId: string;
  role: Role;
};

export async function getAuthUser() {
  const sb = await supabaseServer();
  const { data, error } = await sb.auth.getUser();
  if (error) return null;
  return data.user ?? null;
}

export async function requireSignedIn() {
  const authUser = await getAuthUser();
  if (!authUser) redirect('/login');
  return authUser;
}

export async function requireActor(): Promise<Actor> {
  const authUser = await requireSignedIn();

  const appUser = await db.appUser.findUnique({
    where: { authUserId: authUser.id },
    include: { company: true },
  });

  // IMPORTANT: Onboarding MUST be outside /app layout, because /app layout calls requireActor().
  // If we redirect to /app/onboarding here, we'd create an infinite redirect loop.
  if (!appUser) redirect('/onboarding');

  return {
    authUserId: authUser.id,
    email: appUser.email || authUser.email || '',
    companyId: appUser.companyId,
    appUserId: appUser.id,
    role: appUser.role,
  };
}
