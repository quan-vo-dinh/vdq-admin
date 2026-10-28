"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Globe2,
  FileText,
  ImageIcon,
  History,
  UserRound,
  AlignLeft,
  BriefcaseBusiness,
  GraduationCap,
  Award,
  Code2,
  FolderGit2,
  Mail,
  PanelsTopLeft,
  Search,
  Save,
  Eye,
  Send,
  Check,
  RotateCcw,
  ExternalLink,
  CircleAlert,
  Languages,
} from "lucide-react";
import {
  PortfolioEditorProvider,
  usePortfolioEditor,
} from "@/app/context/portfolio-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@/components/ui/empty";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { MediaLibrary, useEditorCopy } from "./editor-fields";
import { CollectionEditor, type CollectionKey } from "./collection-editor";
import { ResumeEditor, LayoutEditor } from "./section-forms";

export const editorSections = [
  { id: "identity", vi: "Thông tin cá nhân", en: "Profile", icon: UserRound },
  { id: "about", vi: "Giới thiệu", en: "About", icon: AlignLeft },
  { id: "work", vi: "Kinh nghiệm", en: "Experience", icon: BriefcaseBusiness },
  { id: "education", vi: "Học vấn", en: "Education", icon: GraduationCap },
  { id: "certifications", vi: "Chứng chỉ", en: "Certifications", icon: Award },
  { id: "skills", vi: "Kỹ năng", en: "Skills", icon: Code2 },
  { id: "projects", vi: "Dự án", en: "Projects", icon: FolderGit2 },
  { id: "contact", vi: "Liên hệ", en: "Contact", icon: Mail },
  { id: "layout", vi: "Bố cục trang", en: "Page layout", icon: PanelsTopLeft },
  { id: "seo", vi: "Hiển thị tìm kiếm", en: "Search appearance", icon: Search },
] as const;
type Section = (typeof editorSections)[number]["id"];
const collections: CollectionKey[] = [
  "work",
  "education",
  "certifications",
  "skills",
  "projects",
];
export function PortfolioEditor() {
  return (
    <PortfolioEditorProvider>
      <Workspace />
    </PortfolioEditorProvider>
  );
}
export function PortfolioEditorLoading() {
  return (
    <div
      className="mx-auto flex w-full max-w-6xl flex-col gap-6"
      aria-busy="true"
    >
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-12 w-full" />
      <div className="grid gap-6 md:grid-cols-[210px_minmax(0,1fr)]">
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-[480px] w-full" />
      </div>
    </div>
  );
}
function Workspace() {
  const store = usePortfolioEditor(),
    t = useEditorCopy();
  const [section, setSection] = useState<Section>("identity"),
    [tab, setTab] = useState("content"),
    [confirm, setConfirm] = useState<string | null>(null);
  if (store.loading) return <PortfolioEditorLoading />;
  if (store.error || !store.doc)
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CircleAlert />
          </EmptyMedia>
          <EmptyTitle>
            {t("Không tải được portfolio", "Could not load your portfolio")}
          </EmptyTitle>
          <EmptyDescription>
            {t(
              "Nội dung đã lưu vẫn được giữ. Thử kết nối lại để tiếp tục.",
              "Your saved content is safe. Try reconnecting to continue.",
            )}
          </EmptyDescription>
        </EmptyHeader>
        <Button onClick={() => void store.retry()}>
          {t("Thử lại", "Retry")}
        </Button>
      </Empty>
    );
  const resume = store.doc.locales[store.locale];
  const status = store.dirty
    ? t("Có thay đổi chưa lưu", "Unsaved changes")
    : store.hasUnpublishedChanges
      ? t("Có bản nháp chưa xuất bản", "Unpublished draft")
      : t("Đã cập nhật", "Up to date");
  const date = (value: string) =>
    new Intl.DateTimeFormat(store.language === "vi" ? "vi-VN" : "en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  async function confirmAction() {
    const ok =
      confirm === "publish"
        ? await store.publish()
        : confirm === "discard"
          ? await store.reloadLatest()
          : confirm
            ? await store.restore(confirm)
            : false;
    if (ok) setConfirm(null);
  }
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-card">
            <Globe2 className="size-5" />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">Portfolio</h1>
            <p className="text-sm text-muted-foreground">
              {t(
                "Biên tập câu chuyện, kinh nghiệm và những dự án của bạn.",
                "Shape your story, experience and selected work.",
              )}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          render={<Link href="/" target="_blank" />}
          nativeButton={false}
        >
          <ExternalLink data-icon="inline-start" />
          {t("Xem trang công khai", "View public site")}
        </Button>
      </header>
      <div className="flex flex-col gap-3 rounded-xl border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={
                store.dirty || store.hasUnpublishedChanges
                  ? "secondary"
                  : "outline"
              }
            >
              {status}
            </Badge>
            {store.published && (
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Check className="size-3.5" />
                {t("Trang đang công khai", "Site is live")}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {store.lastSaved
              ? `${t("Lưu lần cuối", "Last saved")} ${date(store.lastSaved)}`
              : t(
                  "Lưu bản nháp đầu tiên để xem trước.",
                  "Save your first draft to preview.",
                )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            disabled={store.busy || (!store.dirty && !!store.site)}
            onClick={() => void store.saveDraft()}
          >
            {store.busyAction === "save" ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <Save data-icon="inline-start" />
            )}
            {t("Lưu nháp", "Save draft")}
          </Button>
          <Button
            variant="outline"
            disabled={store.busy || !store.site}
            render={<Link href="/apps/portfolio/preview" target="_blank" />}
            nativeButton={false}
            title={t(
              "Xem phiên bản đã lưu gần nhất",
              "Preview the last saved draft",
            )}
          >
            <Eye data-icon="inline-start" />
            {t("Xem trước", "Preview")}
          </Button>
          <Button
            disabled={
              store.busy ||
              store.dirty ||
              !store.site ||
              !store.hasUnpublishedChanges
            }
            onClick={() => setConfirm("publish")}
          >
            <Send data-icon="inline-start" />
            {t("Xuất bản", "Publish")}
          </Button>
        </div>
      </div>
      {store.dirty && (
        <p className="-mt-3 text-sm text-muted-foreground">
          {t(
            "Lưu nháp trước khi xem trước hoặc xuất bản. Chuyển mục không làm mất nội dung đang sửa.",
            "Save before previewing or publishing. Switching sections keeps your edits.",
          )}
        </p>
      )}
      {store.notice && (
        <Alert
          variant={store.notice.kind === "error" ? "destructive" : "default"}
        >
          <CircleAlert />
          <AlertTitle>{store.notice.message}</AlertTitle>
          {store.conflict && (
            <AlertDescription>
              {t(
                "Bản đang sửa được giữ lại. Sao chép nội dung cần giữ trước khi tải bản mới nhất.",
                "Your edits are retained. Copy anything you need before loading the latest draft.",
              )}
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setConfirm("discard")}
              >
                {t("Tải bản mới nhất", "Load latest draft")}
              </Button>
            </AlertDescription>
          )}
        </Alert>
      )}
      {Object.keys(store.fieldErrors).length > 0 && (
        <Alert variant="destructive">
          <AlertTitle>
            {t(
              "Một số nội dung cần được kiểm tra",
              "Some fields need attention",
            )}
          </AlertTitle>
          <AlertDescription>
            <div className="flex flex-wrap gap-2">
              {Object.keys(store.fieldErrors)
                .slice(0, 6)
                .map((path) => {
                  const key = path.split(".")[2],
                    destination: Section = collections.includes(
                      key as CollectionKey,
                    )
                      ? (key as CollectionKey)
                      : key === "summary"
                        ? "about"
                        : key === "contact"
                          ? "contact"
                          : "identity";
                  const item = editorSections.find(
                    (s) => s.id === destination,
                  )!;
                  return (
                    <Button
                      key={path}
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setTab("content");
                        setSection(destination);
                        if (path.includes(".en.")) store.setLocale("en");
                        if (path.includes(".vi.")) store.setLocale("vi");
                      }}
                    >
                      {t(item.vi, item.en)}: {store.fieldErrors[path]}
                    </Button>
                  );
                })}
            </div>
          </AlertDescription>
        </Alert>
      )}
      {store.cachePending && (
        <Alert>
          <AlertTitle>
            {t(
              "Nội dung đã xuất bản, trang công khai đang cập nhật",
              "Published; the public page is updating",
            )}
          </AlertTitle>
          <AlertDescription>
            <Button
              size="sm"
              variant="outline"
              disabled={store.busy}
              onClick={() => void store.refreshCache()}
            >
              {t("Cập nhật lại trang công khai", "Refresh public page")}
            </Button>
          </AlertDescription>
        </Alert>
      )}
      <Tabs
        value={tab}
        onValueChange={(value) => setTab(String(value))}
        className="gap-6"
      >
        <TabsList
          variant="line"
          className="w-full justify-start overflow-x-auto border-b"
        >
          <TabsTrigger value="content" className="flex-none px-3">
            <FileText />
            {t("Nội dung", "Content")}
          </TabsTrigger>
          <TabsTrigger value="media" className="flex-none px-3">
            <ImageIcon />
            {t("Thư viện ảnh", "Media library")}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-none px-3">
            <History />
            {t("Lịch sử xuất bản", "Version history")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="content">
          <div className="grid items-start gap-6 lg:grid-cols-[210px_minmax(0,1fr)]">
            <nav
              aria-label={t("Các mục portfolio", "Portfolio sections")}
              className="flex gap-1 overflow-x-auto pb-2 lg:sticky lg:top-4 lg:flex-col lg:overflow-visible"
            >
              {editorSections.map((item) => {
                const Icon = item.icon;
                const count = collections.includes(item.id as CollectionKey)
                  ? resume[item.id as CollectionKey].length
                  : null;
                return (
                  <Button
                    key={item.id}
                    variant={section === item.id ? "secondary" : "ghost"}
                    className="shrink-0 justify-start gap-2 lg:w-full"
                    onClick={() => setSection(item.id)}
                    aria-current={section === item.id ? "page" : undefined}
                  >
                    <Icon data-icon="inline-start" />
                    {t(item.vi, item.en)}
                    {count !== null && (
                      <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                        {count}
                      </span>
                    )}
                  </Button>
                );
              })}
              <Separator className="my-2 hidden lg:block" />
              <p className="hidden px-3 text-xs leading-relaxed text-muted-foreground lg:block">
                {t(
                  "Chỉ bản đã xuất bản được hiển thị cho người xem.",
                  "Only published content is visible to visitors.",
                )}
              </p>
            </nav>
            <div className="flex min-w-0 flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Languages className="size-4" />
                  {t("Ngôn ngữ nội dung", "Content language")}
                </div>
                <ToggleGroup
                  variant="outline"
                  size="sm"
                  spacing={0}
                  value={[store.locale]}
                  onValueChange={(values) => {
                    if (values[0]) store.setLocale(values[0] as "vi" | "en");
                  }}
                  aria-label={t("Ngôn ngữ đang biên tập", "Editing language")}
                >
                  <ToggleGroupItem value="vi">Tiếng Việt</ToggleGroupItem>
                  <ToggleGroupItem value="en">English</ToggleGroupItem>
                </ToggleGroup>
              </div>
              <fieldset
                disabled={store.busy}
                className="min-w-0 disabled:opacity-70"
              >
                {collections.includes(section as CollectionKey) ? (
                  <CollectionEditor
                    key={`${section}-${store.locale}`}
                    section={section as CollectionKey}
                  />
                ) : section === "layout" ? (
                  <LayoutEditor />
                ) : (
                  <ResumeEditor
                    section={
                      section as "identity" | "about" | "contact" | "seo"
                    }
                  />
                )}
              </fieldset>
              <p className="text-xs text-muted-foreground">
                {t(
                  "Nội dung Việt và Anh được chỉnh riêng. Thêm, xóa và sắp xếp mục sẽ áp dụng cho cả hai bản.",
                  "Edit Vietnamese and English separately. Adding, removing or reordering items applies to both.",
                )}
              </p>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="media">
          <Card>
            <CardHeader>
              <CardTitle>{t("Thư viện ảnh", "Media library")}</CardTitle>
              <CardDescription>
                {t(
                  "Ảnh chân dung, logo và ảnh dự án. Chọn ảnh tại mục nội dung cần sử dụng.",
                  "Portraits, logos and project covers. Select images from the section where you want to use them.",
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MediaLibrary />
            </CardContent>
            <CardFooter className="justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                {t(
                  "Ảnh đã xuất bản được giữ để có thể khôi phục phiên bản cũ.",
                  "Published images are retained so earlier versions can be restored.",
                )}
              </p>
              <Button
                variant="ghost"
                size="sm"
                disabled={store.busy}
                onClick={() => void store.reconcile()}
              >
                {t(
                  "Khôi phục ảnh tải lên bị gián đoạn",
                  "Recover interrupted uploads",
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>
                {t("Lịch sử xuất bản", "Published versions")}
              </CardTitle>
              <CardDescription>
                {t(
                  "Mỗi lần xuất bản giữ lại một phiên bản. Khôi phục không xóa nội dung đang sửa trong bản nháp.",
                  "Each publication keeps a version. Restoring does not erase your current draft.",
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {store.historyLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : store.historyError ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyTitle>
                      {t("Không tải được lịch sử", "History unavailable")}
                    </EmptyTitle>
                  </EmptyHeader>
                  <Button variant="outline" onClick={() => void store.retry()}>
                    {t("Thử lại", "Retry")}
                  </Button>
                </Empty>
              ) : store.history.length ? (
                <ol className="flex flex-col divide-y">
                  {store.history.map((version, index) => (
                    <li
                      key={version.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-full border">
                          <History className="size-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {date(version.created_at)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {t("Phiên bản", "Version")}{" "}
                            {store.history.length - index}
                          </p>
                        </div>
                        {store.published === version.id && (
                          <Badge variant="secondary">
                            {t("Đang công khai", "Live")}
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={
                          store.busy ||
                          store.dirty ||
                          store.published === version.id
                        }
                        onClick={() => setConfirm(version.id)}
                      >
                        <RotateCcw data-icon="inline-start" />
                        {t("Khôi phục", "Restore")}
                      </Button>
                    </li>
                  ))}
                </ol>
              ) : (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <History />
                    </EmptyMedia>
                    <EmptyTitle>
                      {t("Chưa có lần xuất bản nào", "No published versions")}
                    </EmptyTitle>
                    <EmptyDescription>
                      {t(
                        "Lịch sử xuất hiện sau lần xuất bản đầu tiên.",
                        "History appears after your first publication.",
                      )}
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          disabled={store.busy || !store.dirty}
          onClick={() => setConfirm("discard")}
        >
          <RotateCcw data-icon="inline-start" />
          {t("Bỏ thay đổi chưa lưu", "Discard unsaved changes")}
        </Button>
      </div>
      <Dialog
        open={!!confirm}
        onOpenChange={(open) => {
          if (!store.busy && !open) setConfirm(null);
        }}
      >
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>
              {confirm === "publish"
                ? t("Xuất bản portfolio?", "Publish your portfolio?")
                : confirm === "discard"
                  ? t("Bỏ các thay đổi chưa lưu?", "Discard unsaved changes?")
                  : t("Khôi phục phiên bản này?", "Restore this version?")}
            </DialogTitle>
            <DialogDescription>
              {confirm === "publish"
                ? t(
                    "Bản nháp đã lưu của cả hai ngôn ngữ sẽ thay thế nội dung trên trang công khai.",
                    "Your saved draft in both languages will replace the public content.",
                  )
                : confirm === "discard"
                  ? t(
                      "Tải lại bản đã lưu gần nhất. Các thay đổi chưa lưu sẽ mất.",
                      "Reload the last saved draft. Unsaved edits will be lost.",
                    )
                  : t(
                      "Phiên bản đã chọn sẽ được xuất bản ngay. Bản nháp hiện tại vẫn được giữ.",
                      "The selected version will go live immediately. Your current draft is retained.",
                    )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={store.busy}
              onClick={() => setConfirm(null)}
            >
              {t("Hủy", "Cancel")}
            </Button>
            <Button
              variant={confirm === "discard" ? "destructive" : "default"}
              disabled={store.busy}
              onClick={() => void confirmAction()}
            >
              {store.busy && <Spinner data-icon="inline-start" />}
              {confirm === "publish"
                ? t("Xuất bản", "Publish")
                : confirm === "discard"
                  ? t("Bỏ thay đổi", "Discard changes")
                  : t("Khôi phục và xuất bản", "Restore and publish")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
