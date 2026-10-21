import 'server-only';
import { requestAuth } from '@/lib/auth/request-context';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { readBackendEnvironment } from './env';
import type { Database } from '@/types/database';

export function backendEnvironment() {
  return readBackendEnvironment({
    APP_ENV: process.env.APP_ENV, APP_ORIGIN: process.env.APP_ORIGIN,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_PROJECT_REF: process.env.SUPABASE_PROJECT_REF, VERCEL_ENV: process.env.VERCEL_ENV,
  });
}

export async function serverSupabase() {
  const current = requestAuth.getStore();
  if (current) return current.client;
  const env = backendEnvironment();
  const store = await cookies();
  return createServerClient<Database>(env.url, env.publishableKey, {
    cookieOptions: { sameSite: 'lax', secure: env.mode !== 'local', path: '/' },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) },
    cookies: {
      getAll: () => store.getAll(),
      setAll(values) {
        // Server Components cannot write cookies; proxy refreshes before rendering.
        try { values.forEach(({ name, value, options }) => store.set(name, value, options)); }
        catch { /* Only read access is available during Server Component rendering. */ }
      },
    },
  });
}
