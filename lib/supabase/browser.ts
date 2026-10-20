'use client';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';
// Values are validated on the server before being passed to the login component.
export function browserSupabase(config: { url: string; publishableKey: string }) {
  return createBrowserClient<Database>(config.url, config.publishableKey);
}
