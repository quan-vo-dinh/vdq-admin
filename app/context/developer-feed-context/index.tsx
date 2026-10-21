"use client";
import { apiFetch } from "@/lib/api/transport";
import { createContext, useContext, useState, type ReactNode } from "react";
import useSWRInfinite from "swr/infinite";
import {
  FEED_ERRORS,
  type FeedErrorCode,
  type FeedPage,
  type FeedSource,
} from "@/lib/developer/feed/model";
class FeedRequestError extends Error {
  constructor(public code: FeedErrorCode) {
    super(code);
  }
}
async function fetchPage(url: string): Promise<FeedPage> {
  try {
    const response = await apiFetch(url);
    const data = await response.json();
    if (!response.ok)
      throw new FeedRequestError(
        FEED_ERRORS.includes(data?.code) ? data.code : "unavailable",
      );
    if (!data || !Array.isArray(data.posts))
      throw new FeedRequestError("invalid_response");
    return data;
  } catch (error) {
    throw error instanceof FeedRequestError
      ? error
      : new FeedRequestError("unavailable");
  }
}
function useFeedState() {
  const [source, setSource] = useState<FeedSource>("foryou");
  const [demo, setDemo] = useState(false);
  const result = useSWRInfinite<FeedPage, FeedRequestError>(
    (index, previous) => {
      if (demo || (previous && !previous.nextCursor) || index >= 10)
        return null;
      const params = new URLSearchParams({ source });
      if (previous?.nextCursor) params.set("cursor", previous.nextCursor);
      return `/api/developer/feed?${params}`;
    },
    fetchPage,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateFirstPage: false,
      shouldRetryOnError: false,
      dedupingInterval: 60_000,
      persistSize: false,
    },
  );
  const pages = result.data ?? [];
  return {
    source,
    setSource,
    demo,
    setDemo,
    posts: Array.from(
      new Map(
        pages.flatMap((page) => page.posts).map((post) => [post.id, post]),
      ).values(),
    ),
    fetchedAt: pages[0]?.fetchedAt,
    error: result.error?.code,
    loading: !demo && result.isLoading,
    validating: result.isValidating,
    hasMore:
      pages.length > 0 &&
      !!pages[pages.length - 1].nextCursor &&
      result.size < 10,
    loadMore: () => {
      void result.setSize(result.size + 1);
    },
    reload: () => {
      void result.mutate();
    },
  };
}
const Context = createContext<ReturnType<typeof useFeedState> | null>(null);
export function DeveloperFeedProvider({ children }: { children: ReactNode }) {
  return <Context.Provider value={useFeedState()}>{children}</Context.Provider>;
}
export function useFeed() {
  const context = useContext(Context);
  if (!context) throw new Error("DeveloperFeedProvider missing");
  return context;
}
