import "server-only";
import { createClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";
import { backendEnvironment } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { parseDocument } from "./model";
export function publicPortfolioClient() {
  const env = backendEnvironment();
  return createClient<Database>(env.url, env.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (url, init) => fetch(url, { ...init, cache: "no-store" }),
    },
  });
}
export async function publishedPortfolio() {
  "use cache";
  cacheTag("portfolio-published");
  cacheLife({ stale: 0, revalidate: 60, expire: 300 });
  const result = await publicPortfolioClient().rpc("read_published_portfolio");
  if (result.error) throw new Error("Portfolio unavailable");
  const row = result.data?.[0];
  return row
    ? {
        id: row.id,
        document: parseDocument(row.document),
        createdAt: row.created_at,
      }
    : null;
}
