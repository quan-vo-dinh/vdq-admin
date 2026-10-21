import { withOwner } from "@/lib/auth/api";
import type { NextRequest } from "next/server";
import { getDailyFeed } from "@/lib/developer/feed/server";
import { FeedError } from "@/lib/developer/feed/service";
import type { FeedSource } from "@/lib/developer/feed/model";
async function handleGET(request: NextRequest) {
  const headers = { "Cache-Control": "private, no-store" };
  // Owner authentication is enforced by withOwner; upstream access also requires opt-in.
  if (
    process.env.NODE_ENV === "production" &&
    process.env.DAILY_DEV_FEED_ENABLED !== "true"
  ) {
    return Response.json(
      { code: "deployment_disabled" },
      { status: 503, headers },
    );
  }
  const source = request.nextUrl.searchParams.get("source") ?? "foryou";
  const cursor = request.nextUrl.searchParams.get("cursor");
  if (
    !["foryou", "popular", "discussed"].includes(source) ||
    (cursor !== null && (cursor.length > 1024 || /[\x00-\x1f]/.test(cursor)))
  ) {
    return Response.json({ code: "invalid_request" }, { status: 400, headers });
  }
  try {
    return Response.json(await getDailyFeed(source as FeedSource, cursor), {
      headers,
    });
  } catch (cause) {
    const error =
      cause instanceof FeedError ? cause : new FeedError("unavailable", 502);
    // Never forward upstream response bodies, headers or credentials.
    return Response.json(
      { code: error.code },
      {
        status: error.status,
        headers: { ...headers, "Retry-After": String(error.retryAfter) },
      },
    );
  }
}

export const GET = withOwner<NextRequest>(handleGET);
