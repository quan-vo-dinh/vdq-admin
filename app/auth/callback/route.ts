import { NextResponse } from 'next/server';
import { serverSupabase, backendEnvironment } from '@/lib/supabase/server';
import { requireOwner } from '@/lib/auth/owner';
import { safeNext, AccessError } from '@/lib/auth/policy';
import { privateResponse } from '@/lib/auth/api';

export async function GET(request: Request) {
  const url = new URL(request.url);
  try {
    const env = backendEnvironment();
    const supabase = await serverSupabase();
    const code = url.searchParams.get('code');
    if (!code || url.searchParams.has('error')) throw new AccessError(400, 'oauth_failed');
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw new AccessError(401, 'oauth_exchange_failed');
    await requireOwner(supabase);
    return privateResponse(NextResponse.redirect(new URL(safeNext(url.searchParams.get('next')), env.origin)));
  } catch (error) {
    // A freshly exchanged non-owner session must not remain signed in.
    try { await (await serverSupabase()).auth.signOut({ scope: 'local' }); } catch { /* Fail closed. */ }
    const target = new URL('/auth/auth2/login', new URL(request.url).origin);
    target.searchParams.set('error', error instanceof AccessError ? error.code : 'auth_unavailable');
    return privateResponse(NextResponse.redirect(target));
  }
}
