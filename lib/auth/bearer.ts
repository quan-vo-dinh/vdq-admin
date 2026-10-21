import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { backendEnvironment } from '@/lib/supabase/server';
import type { Database } from '@/types/database';
export function bearerClient(token: string) {
 const env = backendEnvironment();
 return createClient<Database>(env.url, env.publishableKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: { headers: token ? { Authorization: `Bearer ${token}` } : {}, fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) },
 });
}
