import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { backendEnvironment, serverSupabase } from '@/lib/supabase/server';
import { requireOwner } from './owner';
import { AccessError } from './policy';
import { completeOwnerSession } from './owner-session-flow';

// Only called AFTER checking the env password. Admin credentials issue a session;
// all application data still uses the normal user session and existing RLS.
export async function issueOwnerSession() {
  const env = backendEnvironment();
  const key = process.env.OWNER_SESSION_SECRET_KEY;
  const ownerId = process.env.APP_OWNER_USER_ID;
  const githubId = process.env.GITHUB_OWNER_ID;
  if (!key || !ownerId || !githubId) throw new AccessError(503, 'credentials_not_configured');
  const admin = createClient(env.url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) },
  });
  const client = await serverSupabase();
  await completeOwnerSession(ownerId, githubId, {
    async owner() {
      const { data, error } = await admin.auth.admin.getUserById(ownerId);
      const user = data.user;
      if (error || !user) return null;
      const github = user.identities?.find(identity => identity.provider === 'github');
      return {
        id: user.id, email: user.email, confirmed: Boolean(user.email_confirmed_at),
        githubId: String(github?.identity_data?.provider_id ?? github?.identity_data?.sub),
      };
    },
    async token(email) {
      // Existing confirmed owner only. No password change, email delivery,
      // or token returned to the browser. Check the returned UUID before use.
      const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email });
      if (error || !data.user || !data.properties) return null;
      return { ownerId: data.user.id, hash: data.properties.hashed_token };
    },
    async verify(hash) {
      const { data, error } = await client.auth.verifyOtp({ type: 'email', token_hash: hash });
      return { userId: error ? undefined : data.user?.id, issued: Boolean(data.session) };
    },
    authorize: () => requireOwner(client),
    revoke: () => client.auth.signOut({ scope: 'local' }),
  });
}
