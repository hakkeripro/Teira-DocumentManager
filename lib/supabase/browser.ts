'use client';

import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';

type BrowserClient = ReturnType<typeof createSupabaseBrowserClient>;

/**
 * IMPORTANT (Next.js):
 * - Client bundles only inline env vars when accessed via direct property access.
 * - Do NOT use dynamic indexing like process.env[name] in client code.
 */
export function createBrowserClient(): BrowserClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) throw new Error('Supabase env missing (NEXT_PUBLIC_SUPABASE_URL)');
  if (!anonKey) throw new Error('Supabase env missing (NEXT_PUBLIC_SUPABASE_ANON_KEY)');

  return createSupabaseBrowserClient(url, anonKey);
}

// Backwards-compatible alias (older code may call supabaseBrowser())
export const supabaseBrowser = createBrowserClient;
