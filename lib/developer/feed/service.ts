import { normalizePage } from "./adapter";
import type { FeedErrorCode, FeedPage, FeedSource } from "./model";
export class FeedError extends Error {
  constructor(
    public code: FeedErrorCode,
    public status: number,
    public retryAfter = 60,
  ) {
    super(code);
  }
}
export const FEED_CACHE_MS = 6 * 60 * 60 * 1000;
// Bounded per-process cache. Nothing is written to disk or a database.
export function createFeedService(options: {
  token: () => string | undefined;
  fetcher?: typeof fetch;
  now?: () => number;
}) {
  const fetcher = options.fetcher ?? fetch,
    now = options.now ?? Date.now;
  const pages = new Map<string, { expires: number; page: FeedPage }>();
  const pending = new Map<string, Promise<FeedPage>>();
  let lastToken: string | undefined;
  let blocked: { until: number; error: FeedError } | undefined;
  return async function getFeed(
    source: FeedSource,
    cursor: string | null = null,
  ): Promise<FeedPage> {
    const token = options.token()?.trim();
    if (!token) throw new FeedError("not_configured", 503);
    if (lastToken !== token) {
      pages.clear();
      blocked = undefined;
      lastToken = token;
    }
    const key = `${source}:${cursor ?? ""}`;
    const cached = pages.get(key);
    if (cached && cached.expires > now()) return cached.page;
    if (blocked && blocked.until > now()) throw blocked.error;
    const existing = pending.get(key);
    if (existing) return existing;
    if (pending.size >= 4) throw new FeedError("rate_limited", 429);
    const request = (async () => {
      try {
        const url = new URL(`https://api.daily.dev/public/v1/feeds/${source}`);
        url.searchParams.set("limit", "20");
        if (source === "discussed") url.searchParams.set("period", "7");
        if (cursor) url.searchParams.set("cursor", cursor);
        const response = await fetcher(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          cache: "no-store",
          redirect: "error",
          signal: AbortSignal.timeout(12_000),
        });
        if (!response.ok) {
          if (response.status === 401 || response.status === 403)
            throw new FeedError("unauthorized", 502, 300);
          if (response.status === 429) {
            const header = response.headers.get("retry-after");
            const retry =
              header && /^\d+$/.test(header)
                ? Number(header)
                : header
                  ? (Date.parse(header) - now()) / 1000
                  : 60;
            throw new FeedError(
              "rate_limited",
              429,
              Number.isFinite(retry)
                ? Math.max(60, Math.min(86400, Math.ceil(retry)))
                : 60,
            );
          }
          throw new FeedError("unavailable", 502);
        }
        let page: FeedPage;
        try {
          page = normalizePage(
            await response.json(),
            source,
            new Date(now()).toISOString(),
          );
        } catch {
          throw new FeedError("invalid_response", 502);
        }
        // Do not return/cache a result belonging to credentials that changed mid-flight.
        if (options.token()?.trim() !== token)
          throw new FeedError("unavailable", 503);
        if (pages.size >= 30) pages.delete(pages.keys().next().value!);
        pages.set(key, { expires: now() + FEED_CACHE_MS, page });
        return page;
      } catch (cause) {
        const error =
          cause instanceof FeedError
            ? cause
            : new FeedError("unavailable", 502);
        if (options.token()?.trim() === token)
          blocked = { until: now() + error.retryAfter * 1000, error };
        throw error;
      } finally {
        pending.delete(key);
      }
    })();
    pending.set(key, request);
    return request;
  };
}
