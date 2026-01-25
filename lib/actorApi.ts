import { supabaseServer } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import type { Actor } from '@/lib/actor';

/**
 * API routes cannot use next/navigation redirects.
 * This helper mirrors requireActor() but returns null instead of redirecting.
 */
export async function getActorApi(): Promise<Actor | null> {
  const sb = await supabaseServer();
  const { data, error } = await sb.auth.getUser();
  if (error) return null;
  const authUser = data.user;
  if (!authUser) return null;

  const appUser = await db.appUser.findUnique({
    where: { authUserId: authUser.id },
    include: { company: true },
  });
  if (!appUser) return null;

  return {
    authUserId: authUser.id,
    email: appUser.email || authUser.email || '',
    companyId: appUser.companyId,
    appUserId: appUser.id,
    role: appUser.role,
  };
}

export async function requireActorApi(): Promise<Actor> {
  const actor = await getActorApi();
  if (!actor) {
    const err = Object.assign(new Error('Unauthorized'), { statusCode: 401 });
    throw err;
  }
  return actor;
}
