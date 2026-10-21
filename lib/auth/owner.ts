import 'server-only';
import { requestAuth } from './request-context';
import { serverSupabase } from '@/lib/supabase/server';
import { AccessError, checkOwnerConfiguration } from './policy';

export async function requireOwner(client?: Awaited<ReturnType<typeof serverSupabase>>) {
  const supabase = client ?? await serverSupabase();
  // getUser verifies with Auth. Never authorize using getSession/cookie/user_metadata.
  const { data: { user }, error } = await supabase.auth.getUser(requestAuth.getStore()?.token);
  if (error || !user) throw new AccessError(401, 'unauthenticated');
  const { data, error: registryError } = await supabase.rpc('assert_owner');
  if (registryError) {
    if (registryError.code === '42501') throw new AccessError(403, 'owner_required');
    throw new AccessError(500, 'owner_registry_unavailable');
  }
  const owner = data?.[0];
  if (!owner || owner.user_id !== user.id) throw new AccessError(403, 'owner_required');
  checkOwnerConfiguration(owner.user_id, owner.github_user_id, { APP_OWNER_USER_ID: process.env.APP_OWNER_USER_ID, GITHUB_OWNER_ID: process.env.GITHUB_OWNER_ID });
  const github = user.identities?.find(identity => identity.provider === 'github');
  const githubId = github?.identity_data?.provider_id ?? github?.identity_data?.sub;
  if (String(githubId) !== owner.github_user_id) throw new AccessError(403, 'github_identity_mismatch');
  return { supabase, user };
}
