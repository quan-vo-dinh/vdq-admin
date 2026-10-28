# Portfolio content contract

Public `/portfolio` renders the current validated snapshot. It defaults to Vietnamese; the `portfolio-locale` cookie chooses English. The portfolio owns a local theme surface (`portfolio-surface-theme`), preserving dashboard theme/language preferences. Original source components, spacing, animations, logos and copy are ported under `components/portfolio`; scoped Radix components do not replace dashboard Base UI primitives. Static source assets are versioned in `public/portfolio-assets`; newly uploaded rasters use private `portfolio-media` Storage.

Owner `/apps/portfolio` uses a feature-local SWR context and structured fields for both locales, lists, order, visibility, navigation, images and SEO. Item IDs stay stable and translation ID sets match. Save writes a draft, preview renders that saved draft at `/apps/portfolio/preview`, and Publish is explicit. Restore republishes an immutable old version as a new publication and retains the current draft. Preview is authenticated, no-store and noindex.

All owner routes use `withOwner`, verified owner identity/registry, origin checks and private/no-store responses. No service credential is used by runtime public rendering or CRUD. Public proxy exemptions are exact `/portfolio` and UUID-shaped public media GET paths. No owner API group exemption exists.

| Endpoint | Method | Input / output |
|---|---|---|
| `/api/portfolio/draft` | GET | `{site: null | {draft,revision,published_id,...}}` |
| `/api/portfolio/draft` | PATCH | `{document,expectedRevision}` → `{site}`; revision 0 creates only if absent |
| `/api/portfolio/publish` | POST | `{expectedRevision}` → `{version,site,cacheRefreshPending}` |
| `/api/portfolio/history` | GET | `{versions:[{id,created_at,draft_revision}]}` |
| `/api/portfolio/restore` | POST | `{expectedRevision,versionId}` → `{version,site,cacheRefreshPending}` |
| `/api/portfolio/refresh` | POST | Retry publication cache invalidation; no database write |
| `/api/portfolio/media` | GET | Private registered upload metadata |
| `/api/portfolio/media` | POST | Raw PNG/JPEG/WebP, at most 2 MiB and 16 MP decoded; re-encodes WebP → `{media}` |
| `/api/portfolio/media/reconcile` | POST | Recover valid immutable uploads whose registration was interrupted; no deletions |
| `/api/portfolio/media/:id` | GET | Owner-only WebP bytes, no-store |
| `/api/portfolio/public/media/:id` | GET | Bytes only when referenced by current publication; must-revalidate |

400 denotes invalid content, 401 missing session, 403 owner/origin rejection, 404 missing record/media, 409 stale revision, 413 oversized upload, 500/503 unavailable persistence/storage. Owners must reload a conflict before saving again. Publish and restore increment the site revision; immutable version writes and pointer changes are atomic. Database JSON schema and additional URL/image/ID/parity/social/media checks also validate direct RPC writes. Arbitrary SVG/HTML/JSX is never stored as executable content. React Markdown keeps HTML disabled.

`read_published_portfolio()` exposes only the enabled owner's current version; anon cannot select sites, historical versions or media metadata. The separate `read_published_portfolio_media(uuid)` and Storage SELECT policy expose only current references. Media are immutable to app clients and kept for every retained draft/version; a former publication's private media stops being publicly readable. Public bytes never use an owner cookie/service key. Public content cache has only published DTOs, a publication tag and a 60-second fallback refresh interval; failed invalidation is returned separately for retry, never reported as a failed committed publication.

Initial import preserves source copy independently in each locale, including VI education end `09/2026` versus EN `Oct 2026`. Blog and Moments stay external to the old portfolio, and Studio now opens this CMS. Neither old content system is migrated. `/` continues to redirect to `/developer`.

# Validation and operations

`pnpm test:portfolio` checks model and rollback-only pgTAP integration. `node scripts/backend/test-portfolio-api-local.mjs` exercises real local owner authorization, media decoding/preview/publish and CAS; it restores original content and keeps test versions/media. `node scripts/backend/drill-portfolio-local.mjs` runs after preparing/starting `--portfolio` restore workdir, refuses populated targets, and validates remapped version pointer/media plus SHA256 object readback.

The explicit hosted rollout `node --env-file=.env.cloud-tooling.local scripts/backend/rollout-portfolio-hosted.mjs` pins the reviewed project, takes/decrypts an encrypted backup, checks a business-data fingerprint, applies only `20261028000100_portfolio.sql`, records its ledger entry and imports/publishes only when no site exists. Repeat runs never replace drafts or publications. Existing-domain data fingerprints must remain unchanged. No secrets belong in output or Git.

Backup adapters include site/draft, retained versions and all registered portfolio objects. Prior bundles without the new migration receive empty portfolio arrays. Restore remaps singleton site ID/owner IDs and Storage paths; current pointer FKs are deferred and version IDs remain stable. The separate `/tmp/dashboard-portfolio-drill` target avoids overwriting an older P09 drill. Registered unused uploads remain backed up for recovery; reconciliation registers valid orphan objects after failed attachment. Static original assets restore with the code revision.

Native navigation maps `/portfolio` and `/apps/portfolio` to a web bridge. The native app does not bundle the server owner gate or pass its bearer token to a browser; the owner signs into the website separately. CMS draft status identifies the saved draft and live version independently. Unsaved content triggers browser unload and link-navigation protection; preview intentionally reads the last saved draft.
