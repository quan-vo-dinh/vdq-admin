# Portfolio integration implementation plan

## Approved scope and execution

- Source: sibling `../vodinhquan.v1`; target: this repository, on `main` throughout.
- Preserve the complete home portfolio UI and bilingual copy; Blog/Moments/Studio systems are out of scope. Keep Blog/Moments as external links to the old website; Studio points to the new owner editor.
- Install missing UI dependencies required for fidelity, including scoped Radix primitives when needed. Do not rewrite the portfolio into the dashboard design language.
- Public `/` (supersedes the initial `/portfolio` route); `/portfolio` permanently redirects to `/`. Owner editor `/apps/portfolio`; owner-only preview `/apps/portfolio/preview`; private dashboard `/developer`.
- Draft -> preview -> explicit publish. Supabase persistence and object storage; immutable published snapshots; public cache containing published data only.
- User explicitly authorizes production migrations, commit and push directly to main. No branch/worktree/PR needed. Preserve unrelated work; no reset, force push, destructive production reset, or exposed secrets.

## Phase 0 - baseline and design decisions

Read root/nested instructions, current source and rollout tooling; verify git status, origin/main divergence, supported Node/pnpm and local backend availability. Inspect source UI, dependencies, dictionaries and assets. Read installed Next documentation before coding. Record baseline lint/build results without attributing pre-existing failures to this feature.

Target composition: original compact portfolio, source sections, background, motion, light/dark, Vietnamese/English. Use original components/dependencies adapted behind portfolio-local imports. Owner editor follows dashboard primitives, forms, context and SWR conventions. Keep public rendering server-side with small interaction components. Preserve keyboard access, reduced motion, image fallbacks and narrow-screen layout.

## Phase 1 - contract, schema and security

Implement `lib/portfolio` model, strict validation, stable IDs for every list item, localized fields by ID, allowlisted icon registry, explicit safe URL handling and bounded input. Never persist executable JSX/HTML or arbitrary SVG. Preserve differing original locale copy/dates during import; do not silently invent corrections.

Create additive migrations for portfolio site/draft/revisions and media references. A typed JSONB document is appropriate for a single site. Draft writes use expected revision; stale updates return 409. Publishing validates a full document and atomically creates immutable snapshot and updates current pointer. Owner-only rollback republishes an older snapshot. Match existing owner registry/RLS conventions; do not change grants on existing personal tables. Public database access can retrieve only the current published DTO through a narrowly scoped reader; no owner credentials or service-role access for public render. Anon/non-owner cannot read drafts, historical private content, or write data through direct Data API/RPC.

Add a local contract documenting draft GET/PATCH, publish, history/restore and media endpoints, request/response/error/cache semantics. Owner routes reuse `withOwner`, origin checks, error mapping and `requireOwner`; public route has a narrow explicit proxy exception before auth/backend session work, without allowing all portfolio APIs. Preview is private/no-store/noindex and server-authorized. Never cache owner identity or draft content publicly.

## Phase 2 - persistence and media

Implement database-backed owner repository and published reader, typed database definitions and feature routes. No runtime fixture fallback on database errors. Import original content through a repeat-safe explicit bootstrap operation without overwriting existing edits. Publish initial imported content only as part of the authorized launch, and document it.

Add portfolio storage separate from private goal images. Draft uploads are private; published delivery exposes only assets referenced by published content. Bound upload bytes and decoded pixels, validate actual format and re-encode raster images using existing sharp patterns. Preserve original SVG logos in source assets, rather than permit arbitrary SVG uploads. Keep referenced media for retained versions; failed attach/cleanup must be recoverable. Track media references and cover backup/restore.

## Phase 3 - public UI port

Port Hero/About/Work/Education/Certifications/Skills/Projects/Contact and background, motion, dark/light, language controls with source assets and missing dependencies. Scope public tokens/typography/styles so dashboard global text sizes and theme attributes do not change source appearance. Do not overwrite shared primitives or import a second global Tailwind reset. Handle portal styling intentionally. Avoid competing document-level theme/language providers; establish clear ownership per surface.

Reuse one renderer for public published content and owner draft preview. Ensure original layout widths, spacing, fonts, image treatments, hover/disclosure behavior, icon registry and responsive behavior. Metadata/canonical/OG use the deployed origin and public path, with private preview excluded from indexing. Cache published content by version/tag and locale only; after publish invalidate relevant cached output and make cache failure retryable without claiming the database publish failed.

## Phase 4 - owner content management

Add sidebar link and feature-local SWR/context. Build structured editing for identity/About, work, education, certifications, skills, projects, contact, section visibility/order, navigation and SEO. Include both locales, stable list IDs, add/edit/delete/reorder, media upload/selection, validation errors, loading/empty/error states, unsaved changes indicator, revision conflicts and draft/published status. Provide Save draft, Preview, Publish, version history and restore controls. Do not substitute raw JSON-only editing for the requested content management UI.

## Phase 5 - tests and visual verification

Meaningful validation: model/URL/icon/localization checks; pgTAP or equivalent SQL tests for anon/non-owner/owner, no direct draft disclosure, publish atomicity, stale revisions, and current snapshot isolation. Exercise persistence across restart and draft changes before/after publish. Validate backup/restore including new tables/media and backward handling of existing backups.

Run scoped lint and required full lint, production build, relevant backend tests and mobile contracts/typecheck when shared modules change. Record pre-existing failures separately. Inspect actual public and preview render against source, desktop/mobile, both themes/locales and reduced motion where tooling permits. Check dashboard -> portfolio -> dashboard styles and existing login/Notes/Finance regressions. If browser tooling unavailable, report that gate honestly; do not equate build or HTTP checks to visual fidelity.

## Phase 6 - production rollout and handoff

Use existing private env/tooling without printing secrets or putting credentials in arguments/artifacts. Verify exact reviewed production project, migration ledger and pending changes; take and verify encrypted backup before additive migration. Do not apply unrelated pending migrations blindly. Apply reviewed migration, bootstrap content/media repeat-safely, regenerate/check types, read back schema/RLS/current publication and verify anonymous vs owner access. Migration is not evidence of deployed frontend.

Update backup/restore adapters and docs. Commit reviewed feature changes on main and push normally to origin/main. Observe Git-triggered deployment and verify deployed commit/URL plus public/private HTTP behavior. Do not claim deployment if it cannot be observed. Handoff: commit, push status, deployment status, production migration identifiers, routes, test results, evidence and any open visual/owner-browser gates. Keep plan updated with actual decisions and completed steps.

## Execution record (2026-10-28)

- Implemented the versioned JSONB model/validation, additive schema and atomic CAS save/publish/restore RPCs, exact public proxy exception, current-only public content/media readers, private media uploads and recovery, full source UI port, bilingual structured CMS and standalone authenticated draft preview. Original raster assets remain code-versioned; new raster uploads use the separate private bucket. Original SVG logos are source components, never uploadable content.
- Used feature-local SWR context in `components/portfolio/editor.tsx`; public source components are server-prerendered with their original client interactions. Portfolio-local theme tokens and dark variant exclusion preserve dashboard styles and theme/language preferences. Header and sidebar link to the integrated routes. Mobile routes explicitly bridge to the website rather than bundle Next server authorization modules or forward credentials.
- Preserved source locale copy/date differences. Blog/Moments remain external; Studio opens the CMS. `/` → `/developer` unchanged.
- Production `wcgdvsiiemurehkprvqw`: applied only `20261028000100_portfolio.sql`, after encrypted/decrypted backup `2026-10-28T10-35-44.754Z.enc.json`. Repeat-safe import created one site and one immutable initial publication; existing-domain fingerprints unchanged. RLS enabled on all three tables; anon Data API current RPC returns one schema-v1 document, while draft/history/media tables and publish RPC reject anon (401); non-owner authenticated reads return zero private rows. Post-migration encrypted backup was also captured and decrypted.
- Verification: model 4/4; rollback-only pgTAP 43/43; real local owner API/media/preview/publish 11 checks; backend setup 31/31; mobile contracts 10/10 and mobile typecheck; production build successful; scoped lint zero errors (two intentional raw-image warnings). Full lint baseline had 17 errors/43 warnings; final has the exact same 17 errors and 45 warnings. No baseline errors were silently fixed.
- Encrypted restore drill passed on separate `/tmp/dashboard-portfolio-drill` with three retained versions and one uploaded portfolio object; verified singleton/owner remapping, pointer FK, private/public boundary and SHA256 bytes. The existing older P09 drill data were preserved.
- Root review inspected source and local desktop captures using native Chrome. Corrected avatar mapping from that inspection. This establishes structural desktop comparison, not pixel-perfect acceptance. Full mobile/both-theme/both-locale interactive visual QA remains unverified because the browser connector was unavailable and native Chrome was in active user use; no user work was disturbed for further checks.
- Git commit/push and Git-triggered deployment observation are reported with exact commit/URL in the final handoff; database rollout above is separate from frontend deployment.


## Follow-up scope (2026-10-28)

The user moved the public portfolio to `/`, removed the entire bottom dock and placed the language control beside the theme control in a normal-flow top-right row. This supersedes the initial root-to-dashboard redirect and dock requirement above. The old `/portfolio` path returns 308 before authentication. Dashboard `/developer` and owner CMS/preview remain private; authentication defaults to `/developer` while preserving explicit safe destinations. Canonical/OG links, published-cache invalidation, dashboard/CMS public links, the native web bridge and HTTP smoke paths now target `/`. Published JSONB navigation fields and historical snapshots are retained; no migration or content mutation is needed.

Follow-up verification: scoped lint zero errors (one existing editor image warning), auth-policy tests 4/4 and production build pass. Read-only HTTP smoke on localhost:3000 verifies anonymous root VI/EN rendering, root canonical/OG locale, controls before hero, absence of bottom dock markup, old path 308 preserving query, private dashboard/CMS/preview redirects and draft API 401. Browser inventory was retried: browser access host remains unavailable; active native Chrome was not touched. No schema migration or production content write is involved in this follow-up.

## CMS layout and skill logo follow-up

Skills now use a responsive grid of up to four columns with each skill's stored logo; the icon selector shows both logo and human-readable name. `simple-icons` is installed at an exact version and the selected brand paths are imported by name into the shared portfolio icon registry. This replaces runtime `cdn.simpleicons.org` images in both the CMS and the public/preview renderer. Existing icon keys, the original inline SVGs, stored documents and the database allowlist stay compatible; no content rewrite or migration is required. The package is available locally, while the UI exposes the existing approved icon catalog rather than all upstream brands.

Profile editing places text fields on the left and a large square portrait panel on the right when the form container has enough room. Contact editing groups invitation copy and contact channels in two columns. Project cards form a two-column grid with full-width 16:9 cover previews and square bottom image corners; project editing uses a wider dialog with a separate large cover column and no image padding. Experience, education and certification dialogs also pair short fields in two columns. These layouts collapse to one column on narrow screens.

Validation: production build and scoped lint pass. Full lint retains the unrelated baseline of 17 errors and 43 warnings (one old remote-image warning removed by the SVG conversion). Browser inventory still reports an unavailable browser host; native Chrome actions were rejected after user activity, and subsequent reads timed out. Interactive visual acceptance for these new CMS layouts remains pending; build checks do not establish it.

## Configurable prose annotations and formatting

The CMS now offers Bold, Italic and Add tooltip actions alongside supported prose fields, with a live Markdown/tooltip preview. Select a phrase in the text area, choose Add tooltip, configure title, plain-text explanation, optional registered image and safe URL, choose highlight/underline and apply. Repeated phrases have a 1-based occurrence selector. Existing cards can be edited, disabled or removed from the same field. Profile introduction, About, experience contributions, project descriptions, project introduction and the two contact-message fragments use the shared renderer.

Work/project tooltips are staged together with their item dialog: cancel discards both prose and note changes, while Apply updates only the draft. Confirmed item deletion also removes its attached notes in both languages; other translated cards are preserved. Root prose edits update the existing draft context. Language-specific annotation arrays remain independent. Stale phrases stay configurable and do not render until matched again. Markdown code and existing links retain their normal behavior; notes do not create nested link/button interactions. Overlapping notes resolve deterministically. Markdown entities, escaping, formatting and About's collapsed/expanded source offsets are covered by real-parser rendering tests.

The public card follows the visual idea of Aceternity Tooltip Card (image plus explanatory text and optional link), composed with the installed Base UI Popover for hover, keyboard activation, tap, dismissal and collision handling. Its portal is mounted under the portfolio surface to inherit its independent light/dark tokens and escape paragraph/accordion clipping. Raw HTML is skipped and arbitrary Markdown image requests are suppressed; card images use the existing owner-private/current-public media routes. The hover card does not scrape websites or fetch arbitrary remote previews.

Migration `20261028000200` extends only the strict private JSON validator with optional annotation metadata. It was applied locally and on production with verified encrypted backup and unchanged business-content fingerprints. Drafts and historical snapshots stay private; publication remains explicit. Original snapshots do not acquire an empty annotations array on read, preserving fingerprint equality. Production content was not edited or published during this rollout.

Validation: production build and scoped lint pass; repository full-lint baseline remains 17 errors/43 warnings outside this scope. Backend/model/rendering suite passes, with additional rollback-only SQL checks for schema parity, annotation-only media ownership and draft/current/historical visibility. The host browser connector remains unavailable and native Chrome refused actions during user activity; these checks do not constitute interactive visual acceptance of the new toolbar/dialog/hover behavior.
