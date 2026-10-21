import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { backendEnvironment } from '@/lib/supabase/server';
import { AccessError } from './policy';
/** Dedicated admin-only limiter, never used for application data. Fails closed if migration absent. */
export async function consumeMobileLoginAttempt() {
 const env = backendEnvironment();
 const key = process.env.OWNER_SESSION_SECRET_KEY;
 if (!key) throw new AccessError(503, 'credentials_not_configured');
 const client = createClient(env.url, key, { auth: { persistSession: false, autoRefreshToken: false } });
 const { data, error } = await client.rpc('consume_mobile_login_attempt');
 if (error) throw new AccessError(503, 'rate_limit_unavailable');
 if (data !== true) throw new AccessError(429, 'rate_limited');
}
