'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/browser';

export default function LoginForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserClient(), []);

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const redirectTo = nextPath && nextPath.length > 0 ? nextPath : '/app';

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;

        router.push(redirectTo);
        router.refresh();
        return;
      }

      // signup
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) throw signUpError;

      // If email confirmation is enabled, Supabase may return no session here.
      if (!data.session) {
        setInfo('Account created. Please sign in (or confirm email if required).');
        setMode('signin');
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: '40px auto', padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>TEIRA</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => setMode('signin')}
          disabled={loading}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #ddd',
            background: mode === 'signin' ? '#111' : '#fff',
            color: mode === 'signin' ? '#fff' : '#111',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          Sign in
        </button>

        <button
          type="button"
          onClick={() => setMode('signup')}
          disabled={loading}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #ddd',
            background: mode === 'signup' ? '#111' : '#fff',
            color: mode === 'signup' ? '#fff' : '#111',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          Sign up
        </button>
      </div>

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 10 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            autoComplete="email"
            style={{ padding: 10, borderRadius: 8, border: '1px solid #ddd' }}
          />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>Password</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            style={{ padding: 10, borderRadius: 8, border: '1px solid #ddd' }}
          />
        </label>

        {info ? (
          <div style={{ background: '#eef', border: '1px solid #99f', padding: 10, borderRadius: 8 }}>
            {info}
          </div>
        ) : null}

        {error ? (
          <div style={{ background: '#fee', border: '1px solid #f99', padding: 10, borderRadius: 8 }}>
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: 10,
            borderRadius: 8,
            border: '1px solid #111',
            background: '#111',
            color: '#fff',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>
      </form>
    </main>
  );
}
