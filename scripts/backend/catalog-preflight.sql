-- Read-only P01 snapshot, safe to run locally or in the intended cloud SQL Editor.
-- No user data, auth identities or secret settings are selected.
SELECT jsonb_build_object(
  'server_version', current_setting('server_version'),
  'tables', COALESCE((SELECT jsonb_agg(jsonb_build_object('schema', n.nspname, 'name', c.relname, 'rls', c.relrowsecurity, 'force_rls', c.relforcerowsecurity, 'acl', c.relacl::text)) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','p','v','m','S')), '[]'::jsonb),
  'default_privileges', COALESCE((SELECT jsonb_agg(jsonb_build_object('owner', pg_get_userbyid(d.defaclrole), 'schema', n.nspname, 'object_type', d.defaclobjtype, 'acl', d.defaclacl::text)) FROM pg_default_acl d LEFT JOIN pg_namespace n ON n.oid=d.defaclnamespace WHERE n.nspname='public' OR d.defaclnamespace=0), '[]'::jsonb),
  'functions', COALESCE((SELECT jsonb_agg(jsonb_build_object('name', p.proname, 'arguments', pg_get_function_identity_arguments(p.oid), 'security_definer', p.prosecdef, 'acl', p.proacl::text)) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public'), '[]'::jsonb),
  'event_triggers', COALESCE((SELECT jsonb_agg(jsonb_build_object('name', evtname, 'enabled', evtenabled, 'function', evtfoid::regproc::text)) FROM pg_event_trigger), '[]'::jsonb)
) AS preflight;
