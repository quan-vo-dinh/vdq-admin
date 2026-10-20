import { serverSupabase, backendEnvironment } from '@/lib/supabase/server';
import { accessFailure, privateResponse } from '@/lib/auth/api';
import { AccessError, checkOrigin } from '@/lib/auth/policy';
// Logout remains available even after registry disabled/env owner mismatch.
export async function POST(request: Request) {
  try {
    checkOrigin(request, backendEnvironment().origin);
    const supabase = await serverSupabase();
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) throw new AccessError(500, 'logout_failed');
    return privateResponse(Response.json({ ok: true }));
  } catch (error) { return accessFailure(error); }
}
