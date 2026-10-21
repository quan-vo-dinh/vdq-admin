# Owner env login — Production verification, 2026-10-21

- User authorized updating Vercel Production login environment and deploying.
- Project: `vdq-admin`, `prj_42afjCgU71NWGZY0NIISVDKSNcwR`.
- Deployment: `dpl_GxMonTAaQ6FtrTCnFz7UymWr4yHm`, READY and aliased to
  https://vdq-admin.vercel.app . Source: current working tree, including the
  compact Finance header. No commit/push performed by this operation.
- Updated Production only: `OWNER_LOGIN_USERNAME` (config),
  `OWNER_PASSWORD_HASH` (secret), `OWNER_SESSION_SECRET_KEY` (secret).
- Existing production owner UUID and GitHub ID were preserved and verified via
  Auth Admin lookup before saving env. No auth user was created.
- The project's default modern secret key returned `401 Invalid API key` during
  preflight. The existing production service-role key passed the owner lookup
  and was used solely for Auth issuance, as supported by the implementation.
  Application data APIs continue using the owner session and RLS.
- Env values, admin key, generated tokens and session cookies were not printed.
  Production env pulled for validation was removed after the operation.
- Deployment source selection verified: env files excluded; credentials route
  and `.pnpmfile.cjs` included. Cloud build succeeded.
- Production HTTP smoke: credentials POST 200, owner session GET 200, Finance
  GET 200, test session logout POST 200, anonymous session GET 401.
- Browser smoke: normal username/password form successfully opened dashboard.
- This check does not declare all remaining P11 CRUD/media/backup acceptance
  complete; those retain their existing rollout status.
