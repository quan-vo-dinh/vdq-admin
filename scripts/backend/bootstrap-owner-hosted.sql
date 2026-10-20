-- P11 only: run on reviewed cloud wcgdvsiiemurehkprvqw after owner GitHub OAuth.
-- No first-user-wins: match the verified personal GitHub numeric identity exactly.
begin;
do $$
declare candidate uuid; matches integer;
begin
 select count(*),min(i.user_id::text)::uuid into matches,candidate
 from auth.identities i
 where i.provider='github' and i.provider_id='129001260'
   and i.identity_data->>'sub'='129001260';
 if matches<>1 then raise exception 'Exactly one verified GitHub 129001260 identity required'; end if;
 if exists(select 1 from private.app_owner where user_id<>candidate or github_user_id<>'129001260' or not enabled) then
   raise exception 'Existing owner differs or is disabled; refusing replacement';
 end if;
 insert into private.app_owner(user_id,github_user_id) values(candidate,'129001260')
 on conflict(singleton) do nothing;
end $$;
commit;
select user_id as "APP_OWNER_USER_ID",github_user_id as "GITHUB_OWNER_ID",enabled
from private.app_owner;
