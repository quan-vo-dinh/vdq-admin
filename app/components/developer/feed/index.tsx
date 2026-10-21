"use client";

import { useState, useSyncExternalStore } from "react";
import Image from "@/lib/platform/image";
import {
  ArrowUp,
  ArrowUpRight,
  Bookmark,
  Check,
  Clock3,
  MessageCircle,
  Search,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Choice, useDeveloperLocale } from "../shared";
import { feedPosts } from "@/lib/developer/feed/demo";
import {
  selectPosts,
  type FeedPost,
  type FeedOrder,
} from "@/lib/developer/feed/model";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useFeed } from "@/app/context/developer-feed-context";
import { readBookmarks } from "@/lib/developer/feed/bookmarks";
import { cn } from "@/lib/utils";
import { DashboardCard } from "@/app/components/shared/dashboard-card";
import StyleAwareWrapper from "@/app/components/shared/StyleAwareWrapper";

const STORAGE_KEY = "developer-feed-saved-v2";
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("developer-feed-saved", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("developer-feed-saved", callback);
  };
}
function snapshot() {
  try {
    return (
      localStorage.getItem(STORAGE_KEY) ??
      localStorage.getItem("developer-feed-saved-v1") ??
      "[]"
    );
  } catch {
    return "[]";
  }
}
function Cover({ post, large = false }: { post: FeedPost; large?: boolean }) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-muted",
        large ? "aspect-[2/1]" : "aspect-[2/1]",
      )}
    >
      {post.image && !failed ? (
        <Image
          src={post.image}
          unoptimized
          referrerPolicy="no-referrer"
          alt=""
          fill
          sizes={
            large
              ? "(max-width: 768px) 100vw, 800px"
              : "(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 400px"
          }
          className="object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-muted-foreground">
          <BookOpen className="size-10" />
          <span className="font-mono text-sm">{post.tags.join(" / ")}</span>
        </div>
      )}
    </div>
  );
}

export function DeveloperFeed() {
  const { text, language } = useDeveloperLocale();
  const feed = useFeed();
  const availablePosts = feed.demo ? feedPosts : feed.posts;
  const l = language === "vi" ? 0 : 1;
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("all");
  const [order, setOrder] = useState<FeedOrder>("curated");
  const [tab, setTab] = useState("discover");
  const [selected, setSelected] = useState<FeedPost | null>(null);
  const [storageError, setStorageError] = useState(false);
  const raw = useSyncExternalStore(subscribe, snapshot, () => "[]");
  const savedPosts = readBookmarks(raw, feedPosts);
  const saved = savedPosts.map((post) => post.id);
  const posts = selectPosts(
    tab === "saved" ? savedPosts : availablePosts,
    query,
    topic,
    order,
    tab === "saved",
    saved,
  );
  const topics = Array.from(
    new Set(
      (tab === "saved" ? savedPosts : availablePosts).flatMap((p) => p.tags),
    ),
  ).sort();
  function toggleSave(post: FeedPost) {
    const current = readBookmarks(snapshot(), feedPosts);
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          current.some((value) => value.id === post.id)
            ? current.filter((value) => value.id !== post.id)
            : [post, ...current].slice(0, 200),
        ),
      );
      window.dispatchEvent(new Event("developer-feed-saved"));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }
  function saveButton(post: FeedPost) {
    const active = saved.includes(post.id);
    return (
      <Button
        variant={active ? "secondary" : "ghost"}
        size="icon-sm"
        aria-label={text(
          active ? `Bỏ lưu: ${post.title}` : `Lưu bài: ${post.title}`,
          active ? `Unsave: ${post.title}` : `Save: ${post.title}`,
        )}
        aria-pressed={active}
        onClick={() => toggleSave(post)}
      >
        {active ? <Check /> : <Bookmark />}
      </Button>
    );
  }
  return (
    <StyleAwareWrapper
      lyraClassName="developer-board flex min-w-0 flex-col gap-4"
      defaultClassName="flex min-w-0 flex-col gap-4"
    >
      <section
        className="flex min-w-0 flex-col gap-4"
        aria-label="Developer Feed"
      >
        <div className="flex flex-col gap-3">
          <Tabs value={tab} onValueChange={(value) => setTab(String(value))}>
            <div className="flex flex-wrap items-center gap-2 [&_[data-slot=select-trigger]]:h-8 [&_[data-slot=input]]:h-8 [&_[data-slot=tabs-list]]:h-8">
              <TabsList>
                <TabsTrigger value="discover">
                  {text("Khám phá", "Discover")}
                </TabsTrigger>
                <TabsTrigger value="saved">
                  <Bookmark data-icon="inline-start" />
                  {text("Đã lưu", "Saved")} ({saved.length})
                </TabsTrigger>
              </TabsList>
              <Choice
                label={text("Chế độ dữ liệu", "Data mode")}
                value={feed.demo ? "demo" : "daily"}
                onChange={(value) => {
                  feed.setDemo(value === "demo");
                  setTopic("all");
                }}
                items={[
                  { value: "daily", label: "daily.dev" },
                  { value: "demo", label: text("Dữ liệu mẫu", "Demo data") },
                ]}
              />
              {!feed.demo && (
                <>
                  <Choice
                    label={text("Nguồn bảng tin", "Feed source")}
                    value={feed.source}
                    onChange={(value) => {
                      feed.setSource(value as typeof feed.source);
                      setTopic("all");
                      setQuery("");
                    }}
                    items={[
                      {
                        value: "foryou",
                        label: text("Dành cho bạn", "For you"),
                      },
                      { value: "popular", label: text("Phổ biến", "Popular") },
                      {
                        value: "discussed",
                        label: text("Thảo luận · 7 ngày", "Discussed · 7 days"),
                      },
                    ]}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={feed.validating}
                    onClick={feed.reload}
                  >
                    {text("Kiểm tra cập nhật", "Check for updates")}
                  </Button>
                </>
              )}

              <div className="relative min-w-48 flex-1 sm:max-w-72">
                <Search className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9!"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label={text("Tìm bài viết", "Search articles")}
                  placeholder={text("Tìm bài viết…", "Search articles…")}
                />
              </div>
              <Choice
                label={text("Chủ đề", "Topic")}
                value={topic}
                onChange={setTopic}
                items={[
                  { value: "all", label: text("Mọi chủ đề", "All topics") },
                  ...topics.map((value) => ({ value, label: value })),
                ]}
              />
              <Choice
                label={text("Sắp xếp bài viết", "Sort articles")}
                value={order}
                onChange={(value) => setOrder(value as FeedOrder)}
                items={[
                  {
                    value: "curated",
                    label: text("Thứ tự nguồn", "Source order"),
                  },
                  {
                    value: "discussed",
                    label: text("Nhiều thảo luận", "Most discussed"),
                  },
                  { value: "newest", label: text("Mới nhất", "Newest") },
                ]}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">
                  {feed.demo ? text("Dữ liệu mẫu", "Demo data") : "daily.dev"}
                </Badge>
                {feed.fetchedAt && !feed.demo && (
                  <span className="text-xs text-muted-foreground">
                    {text("Cập nhật: ", "Fetched: ")}
                    {new Intl.DateTimeFormat(
                      language === "vi" ? "vi-VN" : "en-GB",
                      {
                        dateStyle: "short",
                        timeStyle: "short",
                        timeZone: "Asia/Ho_Chi_Minh",
                      },
                    ).format(new Date(feed.fetchedAt))}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground" role="status">
                {posts.length} {text("bài viết đã tải", "loaded articles")}
                {topic !== "all" && ` · ${topic}`}
              </p>
              <span className="text-xs text-muted-foreground">
                {tab === "saved"
                  ? text(
                      "Bản lưu trên trình duyệt · Metadata tại lúc lưu",
                      "Saved in this browser · Metadata from time of saving",
                    )
                  : feed.demo
                    ? text(
                        "Chỉ số tương tác mô phỏng · Liên kết đến tài liệu gốc",
                        "Simulated engagement · Links to reference documentation",
                      )
                    : text(
                        "Tìm kiếm và lọc trong các bài đã tải · Nguồn gốc giữ nguyên ngôn ngữ",
                        "Search and filter loaded articles · Original content language",
                      )}
              </span>
            </div>
            {!feed.demo && feed.error && (
              <Alert variant="destructive">
                <AlertTitle>
                  {text("Chưa tải được daily.dev", "Could not load daily.dev")}
                </AlertTitle>
                <AlertDescription>
                  <p>
                    {feed.error === "not_configured"
                      ? text(
                          "Chưa cấu hình DAILY_DEV_TOKEN trong .env.local. Tạo token tại daily.dev/settings/api, thêm vào môi trường server rồi khởi động lại ứng dụng.",
                          "Set DAILY_DEV_TOKEN in .env.local using a token from daily.dev/settings/api, then restart the server.",
                        )
                      : feed.error === "deployment_disabled"
                        ? text(
                            "Bản production chưa bật Feed. Bảo vệ dashboard bằng xác thực trước khi đặt DAILY_DEV_FEED_ENABLED=true.",
                            "Production Feed is disabled. Protect the dashboard with authentication before setting DAILY_DEV_FEED_ENABLED=true.",
                          )
                        : feed.error === "unauthorized"
                          ? text(
                              "Token hết hạn, không hợp lệ hoặc tài khoản chưa được cấp quyền API. Kiểm tra token trên server.",
                              "Token expired, invalid, or API access is unavailable for this account. Check server credentials.",
                            )
                          : feed.error === "rate_limited"
                            ? text(
                                "daily.dev đang giới hạn yêu cầu. Hãy chờ rồi thử lại; không cần tải lại liên tục.",
                                "daily.dev is rate limiting requests. Wait before retrying.",
                              )
                            : text(
                                "Không kết nối được hoặc phản hồi API không hợp lệ. Hãy thử lại sau.",
                                "Connection failed or the API response was invalid. Try again later.",
                              )}
                  </p>
                  {availablePosts.length > 0 && (
                    <p>
                      {text(
                        "Đang giữ dữ liệu đã tải trước đó.",
                        "Previously loaded data remains visible.",
                      )}
                    </p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={feed.validating}
                    onClick={feed.reload}
                  >
                    {text("Thử lại", "Retry")}
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            {!feed.demo && feed.loading && (
              <div
                className="grid gap-4 sm:grid-cols-3"
                aria-label={text("Đang tải bài viết", "Loading articles")}
              >
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
              </div>
            )}

            {storageError && (
              <p role="alert" className="mb-4 text-sm text-destructive">
                {text(
                  "Trình duyệt không cho phép lưu. Hãy kiểm tra quyền lưu trữ rồi thử lại.",
                  "Browser storage is unavailable. Check storage permissions and try again.",
                )}
              </p>
            )}
            {["discover", "saved"].map((value) => (
              <TabsContent key={value} value={value}>
                {posts.length ? (
                  <div className="grid items-stretch gap-px bg-border p-px sm:grid-cols-2 xl:grid-cols-3">
                    {posts.map((post) => (
                      <DashboardCard key={post.id} className="h-full">
                        <button
                          className="-mt-4 block outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                          onClick={() => setSelected(post)}
                          aria-label={text(
                            `Xem nhanh: ${post.title}`,
                            `Preview: ${post.title}`,
                          )}
                        >
                          <Cover post={post} />
                        </button>
                        <CardHeader>
                          <CardDescription>
                            <span className="flex flex-wrap items-center justify-between gap-1 text-xs">
                              <span>
                                {post.source}
                                {feedPosts.some(
                                  (sample) => sample.id === post.id,
                                ) && <Badge variant="outline">Demo</Badge>}
                              </span>
                              <time dateTime={post.createdAt ?? undefined}>
                                {post.createdAt
                                  ? new Intl.DateTimeFormat(
                                      language === "vi" ? "vi-VN" : "en-GB",
                                      {
                                        day: "2-digit",
                                        month: "2-digit",
                                        timeZone: "Asia/Ho_Chi_Minh",
                                      },
                                    ).format(new Date(post.createdAt ?? 0))
                                  : "—"}
                              </time>
                            </span>
                          </CardDescription>
                          <CardTitle>
                            <h2 className="line-clamp-3">
                              <button
                                className="text-left hover:underline focus-visible:outline-ring"
                                onClick={() => setSelected(post)}
                              >
                                {post.title}
                              </button>
                            </h2>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-1 flex-col gap-4">
                          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                            {post.summary[l] ||
                              text(
                                "Chưa có tóm tắt từ nguồn.",
                                "No summary provided by the source.",
                              )}
                          </p>
                          <div className="mt-auto flex flex-wrap gap-1.5">
                            {post.tags.map((tag) => (
                              <Badge key={tag} variant="secondary">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                        <CardFooter className="flex-wrap justify-between gap-2">
                          <span className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <ArrowUp className="size-3.5" />
                              {post.numUpvotes ?? "—"}
                              <span className="sr-only">upvotes</span>
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <MessageCircle className="size-3.5" />
                              {post.numComments ?? "—"}
                              <span className="sr-only">comments</span>
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Clock3 className="size-3.5" />
                              {post.readTime ?? "—"}
                              {text(" phút", " min")}
                            </span>
                          </span>
                          {saveButton(post)}
                        </CardFooter>
                      </DashboardCard>
                    ))}
                  </div>
                ) : !feed.demo &&
                  tab !== "saved" &&
                  (feed.loading || feed.error) ? null : (
                  <Empty>
                    <EmptyHeader>
                      <EmptyTitle>
                        {text(
                          tab === "saved" && !saved.length
                            ? "Danh sách đọc đang trống"
                            : "Chưa tìm thấy bài phù hợp",
                          tab === "saved" && !saved.length
                            ? "Your reading list is empty"
                            : "No matching articles",
                        )}
                      </EmptyTitle>
                      <EmptyDescription>
                        {text(
                          "Lưu bài bằng biểu tượng bookmark, hoặc thử đổi từ khóa và chủ đề.",
                          "Bookmark an article, or try another search and topic.",
                        )}
                      </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setQuery("");
                          setTopic("all");
                          setOrder("curated");
                          setTab("discover");
                        }}
                      >
                        {text("Khám phá tất cả", "Explore all articles")}
                      </Button>
                    </EmptyContent>
                  </Empty>
                )}
              </TabsContent>
            ))}
          </Tabs>
          {!feed.demo && tab !== "saved" && feed.hasMore && (
            <Button
              variant="outline"
              disabled={feed.validating}
              onClick={feed.loadMore}
            >
              {feed.validating
                ? text("Đang tải…", "Loading…")
                : text("Tải thêm bài viết", "Load more articles")}
            </Button>
          )}
        </div>
        <Dialog
          open={selected !== null}
          onOpenChange={(open) => {
            if (!open) setSelected(null);
          }}
        >
          <DialogContent size="lg"
            className="max-h-[90dvh] overflow-y-auto "
            closeLabel={text("Đóng", "Close")}
          >
            {selected && (
              <>
                <DialogHeader>
                  <DialogTitle>{selected.title}</DialogTitle>
                  <DialogDescription>
                    {selected.source} · {selected.readTime ?? "—"}
                    {text("phút đọc", "min read")}
                  </DialogDescription>
                </DialogHeader>
                <Cover post={selected} large />
                <p className="leading-relaxed">{selected.summary[l]}</p>
                <div className="flex flex-col gap-2">
                  <h3 className="font-medium">
                    {text("Vì sao đáng đọc?", "Why read it?")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selected.takeaway[l] ||
                      text(
                        "Mở bài gốc để xem đầy đủ nội dung và ngữ cảnh.",
                        "Open the original article for full content and context.",
                      )}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {text(
                    selected.id.startsWith("demo:") ||
                      feedPosts.some((p) => p.id === selected.id)
                      ? "Đây là bài mẫu; số liệu phục vụ demo và liên kết mở tài liệu tham khảo."
                      : "Metadata từ daily.dev hoặc bản lưu trên trình duyệt; không phải toàn văn bài viết. Chưa tải bình luận.",
                    selected.id.startsWith("demo:") ||
                      feedPosts.some((p) => p.id === selected.id)
                      ? "Sample article; engagement is simulated and the link opens reference documentation."
                      : "Metadata from daily.dev or a browser snapshot, not the full article. Comments have not been fetched.",
                  )}
                </p>
                <DialogFooter>
                  {saveButton(selected)}
                  <Button
                    render={
                      <a
                        href={selected.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    }
                    nativeButton={false}
                  >
                    {text("Mở bài gốc", "Open original")}
                    <ArrowUpRight data-icon="inline-end" />
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </section>
    </StyleAwareWrapper>
  );
}
