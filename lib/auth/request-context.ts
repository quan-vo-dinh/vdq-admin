import 'server-only';
import { AsyncLocalStorage } from 'node:async_hooks';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
export const requestAuth = new AsyncLocalStorage<{ client: SupabaseClient<Database>; token: string }>();
