# Developer Feed

Updated 20 October 2026. UI: `/developer/feed`. API: `/api/developer/feed`.

## Run without a database

1. Generate a Personal Access Token at https://daily.dev/settings/api.
2. Add `DAILY_DEV_TOKEN=your_token` to the gitignored `.env.local` in the project root. `.env.example` documents the configuration. Do not use a `NEXT_PUBLIC_` prefix or put the token in browser storage.
3. Restart `pnpm dev`, open `/developer/feed`, and choose the daily.dev source.

A missing token shows setup instructions. Demo is an explicit separate mode; API errors never silently substitute fictional articles. No token was available during implementation, so account access and successful live responses have not been verified.

## What works

- For You, Popular and Most Discussed (7-day window) feeds, with original titles, summaries, publisher, tags, cover images and engagement where available.
- Source-provided content retains its original language; UI supports VI/EN. Missing summaries, dates, read times and engagement remain unavailable rather than invented. Zero is preserved as zero.
- Cursor pagination (20 posts per request, up to 10 pages per selected source). Search, topic and sort apply to loaded articles, not a global daily.dev search. New source selection clears search/topic.
- Remote covers render directly in the browser with no referrer; missing/failed covers fall back to a topic illustration. No server image proxy or additional image-host allowlist is needed because these images are unoptimized. Remote images still require network access.
- Preview and original-article links. The three-post overview and briefing dialog were removed. Feed follows the Developer board and DashboardCard composition, with compact card headings and clamped article summaries.
- Bookmarks store post snapshots in localStorage, up to 200 entries, and remain accessible when the article leaves the feed or API is unavailable. Counts/dates in saved snapshots reflect time of saving. Existing v1 demo ID bookmarks migrate when v2 is first written. Storage failures show an error. Browser-local only; no cross-device sync or daily.dev bookmark writes.
- Explicit demo mode retains the original eight editorial fixtures and local SVG artwork. Demo posts remain labeled in mixed Saved lists.

## Architecture and request budget

`lib/developer/feed/server.ts` is server-only and reads the environment token. `service.ts` calls the fixed daily.dev host with Bearer authentication, a 12-second timeout and redirects disabled. No client-supplied upstream URL or credential is accepted. Upstream error bodies and private headers are never forwarded.

`adapter.ts` normalizes untrusted API data to `FeedPost`, validates HTTP(S) URLs without embedded credentials, preserves null metadata, validates dates, and drops invalid articles. `bookmarks.ts` validates stored snapshots and supports legacy IDs. The Route Handler validates source/cursor and returns structured error codes. `DeveloperFeedProvider` follows the project's SWR/context pattern using `useSWRInfinite`; UI remains composed from installed Base UI primitives.

Each server process keeps a bounded cache of 30 pages for six hours and coalesces identical concurrent requests. Authorization failures back off for five minutes; rate limits honor a bounded Retry-After; other upstream failures back off for one minute. Browser focus/reconnect and automatic error retry do not trigger new requests. “Check for updates” uses the same server cache rather than bypassing it.

This cache is temporary and is not a database. Server restart, hot reload, serverless cold starts and multiple instances can increase upstream requests. Each distinct source/cursor costs a request when uncached. Six-hour caching does not guarantee staying within a monthly quota; monitor actual usage before increasing automatic refresh frequency.

## Deployment boundary

The current dashboard has no verified owner-authentication layer. This endpoint serves the token owner's personalized feed, so production is disabled by default. Protect the dashboard **and `/api/developer/feed`** with owner authentication or an authenticated reverse proxy before setting `DAILY_DEV_FEED_ENABLED=true`. This flag is an opt-in, not authentication; do not enable it on an unprotected public deployment. Local development requires only the token.

The token stays server-side, but the returned personalized content is intentionally visible to clients allowed to access this endpoint. Keep Next.js runtime hosting; a static export cannot run this integration.

## Source contract checked

- https://docs.daily.dev/welcome-to-the-daily-dev-api/
- https://docs.daily.dev/build-your-own-morning-briefing/
- https://api.daily.dev/public/v1/docs/json

OpenAPI currently defines a `{ data: FeedPost[], pagination: { hasNextPage, cursor } }` response, a Bearer token and `/feeds/foryou`, `/feeds/popular`, `/feeds/discussed`. The discussed endpoint allows `period=7|30|365`; this implementation uses `7` rather than the briefing tutorial's `1`. API remains beta; account availability and rate limits must be checked with the real token.

## Verification

- `node scripts/test-developer-feed.mjs`: normalization, null/zero handling, unsafe URLs, pagination, cache expiry, concurrent deduplication, request destination/auth/redirect handling, upstream 401/403/429/500, response validation, cross-source backoff, saved snapshot persistence/migration, and existing selection/fixture checks passed using synthetic upstream responses.
- Development HTTP: Feed page returns 200; missing token returns 503 `not_configured`; invalid source returns 400 `invalid_request`.
- Production build including TypeScript passed. Existing warnings remain for metadataBase and filesystem tracing in `/api/code`.
- Scoped ESLint passed. Full lint remains at 21 errors and 45 warnings in existing code.
- Browser inspection attempted again: host returned `Local browser use is disabled in Work settings`. Responsive/dark-mode, real thumbnail loading, click/keyboard interactions and reload persistence have not received browser acceptance.

## Next steps

With a token, verify account access, actual nullable fields, remote images, cursor progression and quota behavior. Run browser checks at mobile/tablet/desktop widths and in both themes. A real Morning Briefing with model calls, comment analysis or a scheduler is a separate phase; neither this metadata preview nor the demo editorial is presented as AI output. Database storage is only needed later for durable/shared history or cross-device reading state.
