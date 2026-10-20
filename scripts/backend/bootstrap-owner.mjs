// Local admin tooling only: no public bootstrap endpoint and no first-user-wins.
import { execFileSync } from 'node:child_process';
const githubId = process.argv[2];
if (process.argv.length !== 3 || !/^[1-9][0-9]*$/.test(githubId ?? '')) {
  console.error('Usage: node scripts/backend/bootstrap-owner.mjs VERIFIED_NUMERIC_GITHUB_ID (local only)');
  process.exit(1);
}
const sql = `
begin;
select set_config('app.bootstrap_github_id', :'github_id', true);
do $$
declare candidate uuid; matches integer;
begin
  select count(*), min(i.user_id::text)::uuid into matches, candidate
    from auth.identities i
    where i.provider='github' and i.provider_id=current_setting('app.bootstrap_github_id')
      and i.identity_data->>'sub'=current_setting('app.bootstrap_github_id');
  if matches <> 1 then raise exception 'Exactly one verified GitHub Auth identity is required'; end if;
  if exists(select 1 from private.app_owner where user_id<>candidate or github_user_id<>current_setting('app.bootstrap_github_id')) then
    raise exception 'Existing owner differs; refusing replacement';
  end if;
  insert into private.app_owner(user_id, github_user_id) values(candidate,current_setting('app.bootstrap_github_id'))
    on conflict(singleton) do nothing;
end $$;
commit;
select 'APP_OWNER_USER_ID=' || user_id::text || chr(10) || 'GITHUB_OWNER_ID=' || github_user_id from private.app_owner;
`;
try {
  const result = execFileSync('docker', ['exec', '-i', 'supabase_db_dashboard-personal-local', 'psql', '-XAt', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1', '-v', `github_id=${githubId}`], { input: sql, stdio: ['pipe','pipe','pipe'] }).toString();
  console.log(result.split('\n').filter(line => line.startsWith('APP_OWNER_USER_ID=') || line.startsWith('GITHUB_OWNER_ID=')).join('\n'));
  console.log('Local owner bound. Add the two values to .env.development.local, disable signup, restart local Supabase and Next, then logout/relogin.');
} catch { console.error('Bootstrap refused. Verify local GitHub sign-in/provider identity and existing registry; no cloud operation was attempted.'); process.exitCode=1; }
