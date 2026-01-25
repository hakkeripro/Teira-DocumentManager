import { supabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export function SignOutButton() {
  async function signOut() {
    'use server';
    const sb = await supabaseServer();
    await sb.auth.signOut();
    redirect('/login');
  }

  return (
    <form action={signOut}>
      <button className="btn" type="submit">
        Sign out
      </button>
    </form>
  );
}
