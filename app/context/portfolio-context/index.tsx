"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import useSWR from "swr";
import { ZodError } from "zod";
import { apiFetch } from "@/lib/api/transport";
import { useLanguage } from "@/app/context/language-context";
import {
  parseDocument,
  type PortfolioDocument,
  type Resume,
} from "@/lib/portfolio/model";
import { fingerprint, mirrorResume, hasUnpublishedChanges as comparePublication } from "@/lib/portfolio/editor-state";
import initial from "@/lib/portfolio/initial-content.json";

export type PortfolioLocale = "vi" | "en";
export type PortfolioSite = {
  id?: string;
  draft: PortfolioDocument;
  revision: number;
  published_id: string | null;
  updated_at?: string;
  created_at?: string;
  publishedDocument?: PortfolioDocument | null;
};
export type PortfolioVersion = {
  id: string;
  created_at: string;
  draft_revision: number;
  document?: PortfolioDocument;
};
export type PortfolioMedia = {
  id: string;
  path?: string;
  mime?: string;
  bytes?: number;
  created_at?: string;
};
export type PortfolioNotice = {
  kind: "success" | "warning" | "error";
  message: string;
};
export type PortfolioAction =
  | "save"
  | "publish"
  | "restore"
  | "refresh"
  | "reload"
  | "upload"
  | "reconcile";
export type PortfolioFieldErrors = Record<string, string>;
export type PortfolioEditorState = {
  doc: PortfolioDocument | null;
  setDoc: Dispatch<SetStateAction<PortfolioDocument | null>>;
  updateResume: (
    update: Resume | ((resume: Resume) => Resume),
    locale?: PortfolioLocale,
  ) => void;
  locale: PortfolioLocale;
  setLocale: Dispatch<SetStateAction<PortfolioLocale>>;
  language: PortfolioLocale;
  site: PortfolioSite | null;
  revision: number;
  published: string | null;
  currentPublished: PortfolioVersion | null;
  publishedDraftRevision: number | null;
  history: PortfolioVersion[];
  media: PortfolioMedia[];
  dirty: boolean;
  hasUnpublishedChanges: boolean;
  publicationComparisonKnown: boolean;
  lastSaved: string | null;
  historyLoading: boolean;
  mediaLoading: boolean;
  loading: boolean;
  error: Error | null;
  historyError: Error | null;
  mediaError: Error | null;
  busy: boolean;
  busyAction: PortfolioAction | null;
  conflict: boolean;
  cachePending: boolean;
  fieldErrors: PortfolioFieldErrors;
  notice: PortfolioNotice | null;
  clearNotice: () => void;
  saveDraft: () => Promise<boolean>;
  publish: () => Promise<boolean>;
  restore: (versionId: string) => Promise<boolean>;
  refreshCache: () => Promise<boolean>;
  /** Replaces local content. Caller must confirm discarding unsaved changes first. */
  reloadLatest: () => Promise<boolean>;
  upload: (file: File) => Promise<PortfolioMedia | null>;
  reconcile: () => Promise<boolean>;
  retry: () => Promise<void>;
};
class RequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code);
  }
}
async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(url, {
    ...init,
    cache: "no-store",
    signal: AbortSignal.timeout(30000),
  });
  const result = await response.json();
  if (!response.ok)
    throw new RequestError(response.status, result.code ?? "unavailable");
  return result as T;
}
const Context = createContext<PortfolioEditorState | null>(null);
export function usePortfolioEditor(): PortfolioEditorState {
  const context = useContext(Context);
  if (!context) throw new Error("PortfolioEditorProvider missing");
  return context;
}

export function PortfolioEditorProvider({ children }: { children: ReactNode }) {
  const { language } = useLanguage();
  const text = (vi: string, en: string) => (language === "vi" ? vi : en);
  // Focus/reconnect fetches must not silently change the expected CAS revision underneath a local edit.
  const options = {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    shouldRetryOnError: false,
  };
  const draftStore = useSWR<{ site: PortfolioSite | null }, Error>(
    "/api/portfolio/draft",
    fetchJSON,
    options,
  );
  const historyStore = useSWR<{ versions: PortfolioVersion[] }, Error>(
    "/api/portfolio/history",
    fetchJSON,
    options,
  );
  const mediaStore = useSWR<{ media: PortfolioMedia[] }, Error>(
    "/api/portfolio/media",
    fetchJSON,
    options,
  );
  const [siteOverride, setSiteOverride] = useState<
    PortfolioSite | null | undefined
  >();
  const [localDoc, setLocalDoc] = useState<PortfolioDocument | null>(null);
  const [locale, setLocale] = useState<PortfolioLocale>("vi");
  const [busyAction, setBusyAction] = useState<PortfolioAction | null>(null);
  const operation = useRef(false);
  const [notice, setNotice] = useState<PortfolioNotice | null>(null);
  const [fieldErrors, setFieldErrors] = useState<PortfolioFieldErrors>({});
  const [conflict, setConflict] = useState(false),
    [cachePending, setCachePending] = useState(false);
  const [lastSavedOverride, setLastSavedOverride] = useState<
    string | null | undefined
  >();
  const [knownPublication, setKnownPublication] =
    useState<PortfolioVersion | null>(null);
  const site =
    siteOverride === undefined ? (draftStore.data?.site ?? null) : siteOverride;
  // Initial source content is offered only after an authoritative successful response says no site exists.
  const savedDocument =
    site?.draft ?? (draftStore.data ? (initial as PortfolioDocument) : null);
  const doc = localDoc ?? savedDocument;
  const dirty =
    !!doc && !!savedDocument && fingerprint(doc) !== fingerprint(savedDocument);
  const history = historyStore.data?.versions ?? [],
    media = mediaStore.data?.media ?? [];
  const currentPublished =
    knownPublication?.id === site?.published_id
      ? knownPublication
      : (history.find((v) => v.id === site?.published_id) ?? null);
  const comparisonDocument =
    site?.publishedDocument ?? currentPublished?.document;
  const publicationComparisonKnown =
    !site?.published_id || !!comparisonDocument;
  // Without an owner snapshot response, conservatively show unpublished rather than falsely claiming draft==live after restore.
  const hasUnpublishedChanges = comparePublication(doc, site?.published_id, comparisonDocument);
  const setDoc: PortfolioEditorState["setDoc"] = (update) => {
    setLocalDoc((previous) =>
      typeof update === "function" ? update(previous ?? savedDocument) : update,
    );
    setFieldErrors({});
  };
  const updateResume: PortfolioEditorState["updateResume"] = (
    update,
    targetLocale = locale,
  ) =>
    setDoc((previous) => {
      if (!previous) return previous;
      const resume = previous.locales[targetLocale];
      return mirrorResume(
        previous,
        targetLocale,
        typeof update === "function" ? update(structuredClone(resume)) : update,
      );
    });
  useEffect(() => {
    if (!dirty) return;
    const message =
      language === "vi"
        ? "Bạn có thay đổi chưa lưu. Rời trang và bỏ thay đổi?"
        : "Discard unsaved portfolio changes?";
    const unload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const navigate = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link =
        event.target instanceof Element
          ? event.target.closest("a[href]")
          : null;
      if (
        !(link instanceof HTMLAnchorElement) ||
        link.target === "_blank" ||
        link.hasAttribute("download") ||
        link.href === location.href ||
        (link.pathname === location.pathname &&
          link.search === location.search &&
          link.hash)
      )
        return;
      if (!window.confirm(message)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", navigate, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", navigate, true);
    };
  }, [dirty, language]);
  const errorMessage = (error: unknown) => {
    if (error instanceof RequestError) {
      if (error.status === 409)
        return text(
          "Bản nháp đã thay đổi ở phiên khác. Nội dung bạn đang nhập vẫn được giữ. Tải bản mới nhất khi sẵn sàng.",
          "Another session changed this draft. Your local edits are retained. Reload the latest when ready.",
        );
      if (error.status === 401)
        return text(
          "Phiên đăng nhập đã hết hạn. Đăng nhập lại để tiếp tục.",
          "Your session expired. Sign in again to continue.",
        );
      if (error.status === 403)
        return text(
          "Bạn không có quyền thực hiện thao tác này.",
          "You do not have permission to perform this action.",
        );
      if (error.status === 413)
        return text(
          "Ảnh quá lớn. Chọn tệp tối đa 2 MB.",
          "Image too large. Choose a file up to 2 MB.",
        );
      if (error.code === "invalid_image")
        return text(
          "Ảnh không hợp lệ. Chọn PNG, JPEG hoặc WebP, tối đa 16 megapixel.",
          "Invalid image. Choose PNG, JPEG or WebP, up to 16 megapixels.",
        );
    }
    return text(
      "Không thể hoàn tất thao tác. Nội dung của bạn vẫn được giữ; thử lại sau.",
      "Could not complete this action. Your local content is retained; please retry.",
    );
  };
  async function run<T>(
    action: PortfolioAction,
    work: () => Promise<T>,
  ): Promise<T | null> {
    if (operation.current) return null;
    operation.current = true;
    setBusyAction(action);
    setNotice(null);
    setFieldErrors({});
    try {
      return await work();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors: PortfolioFieldErrors = {};
        for (const issue of error.issues) {
          const path = issue.path.join(".") || "document";
          let reason: string;
          if (issue.message.includes("safe HTTPS")) reason = text("Nhập liên kết HTTPS hoặc liên kết nội bộ hợp lệ.", "Enter a valid HTTPS or internal link.");
          else if (issue.message.includes("portfolio asset")) reason = text("Chọn ảnh từ thư viện portfolio.", "Choose an image from the portfolio library.");
          else if (issue.message.includes("same IDs") || issue.message.includes("IDs must match")) reason = text("Các mục trong hai ngôn ngữ chưa khớp. Kiểm tra lại danh sách.", "The two languages contain different items. Review the lists.");
          else if (issue.message.includes("Duplicate IDs")) reason = text("Danh sách có mục trùng lặp. Kiểm tra lại các mục.", "This list contains duplicate items. Review the entries.");
          else if (issue.message.startsWith("Required social")) reason = text("Giữ đủ các liên kết GitHub, LinkedIn, Facebook và Instagram.", "Keep the GitHub, LinkedIn, Facebook and Instagram profiles.");
          else if (issue.code === "too_big") reason = text("Nội dung vượt quá độ dài hoặc số mục cho phép. Vui lòng rút ngắn.", "This exceeds the allowed length or number of items. Shorten the content.");
          else if (issue.code === "invalid_value") reason = text("Chọn một giá trị có sẵn trong danh sách.", "Choose an available value from the list.");
          else reason = text("Nội dung chưa hợp lệ. Kiểm tra lại trường này.", "This value is invalid. Review this field.");
          errors[path] ??= reason;
        }
        setFieldErrors(errors);
        setNotice({
          kind: "error",
          message: text(
            "Kiểm tra các trường được đánh dấu trước khi lưu.",
            "Check the highlighted fields before saving.",
          ),
        });
      } else {
        if (error instanceof RequestError && error.status === 409)
          setConflict(true);
        setNotice({ kind: "error", message: errorMessage(error) });
      }
      return null;
    } finally {
      operation.current = false;
      setBusyAction(null);
    }
  }
  const send = <T,>(action: string, body?: unknown) =>
    fetchJSON<T>(`/api/portfolio/${action}`, {
      method: action === "draft" ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      ...(body !== undefined && { body: JSON.stringify(body) }),
    });
  async function acceptSite(next: PortfolioSite) {
    setSiteOverride(next);
    await draftStore.mutate({ site: next }, { revalidate: false });
    setConflict(false);
  }
  async function saveDraft() {
    return !!(await run("save", async () => {
      if (!doc) return false;
      const document = parseDocument(doc),
        submitted = fingerprint(doc);
      const result = await send<{ site: PortfolioSite }>("draft", {
        document,
        expectedRevision: site?.revision ?? 0,
      });
      await acceptSite({
        ...result.site,
        draft: parseDocument(result.site.draft),
        publishedDocument: site?.publishedDocument ?? comparisonDocument,
      });
      setLastSavedOverride(result.site.updated_at ?? new Date().toISOString());
      // Edits made while the save was in flight must remain unsaved, never disappear.
      setLocalDoc((current) =>
        current && fingerprint(current) !== submitted ? current : null,
      );
      setNotice({
        kind: "success",
        message: text(
          "Đã lưu bản nháp. Trang công khai chưa thay đổi.",
          "Draft saved. The public page is unchanged.",
        ),
      });
      return true;
    }));
  }
  async function publication(
    action: "publish" | "restore",
    versionId?: string,
  ) {
    return !!(await run(action, async () => {
      if (!site || dirty) {
        setNotice({
          kind: "warning",
          message: text(
            "Lưu bản nháp trước khi xuất bản hoặc khôi phục phiên bản.",
            "Save your draft before publishing or restoring a version.",
          ),
        });
        return false;
      }
      const result = await send<{
        site: PortfolioSite;
        version: PortfolioVersion;
        cacheRefreshPending: boolean;
      }>(action, {
        expectedRevision: site.revision,
        ...(versionId && { versionId }),
      });
      setLastSavedOverride((previous) =>
        previous === undefined
          ? (site.updated_at ?? site.created_at ?? null)
          : previous,
      );
      await acceptSite(result.site);
      setKnownPublication(result.version);
      setCachePending(result.cacheRefreshPending);
      await historyStore.mutate(
        (previous) => ({
          versions: [
            result.version,
            ...(previous?.versions ?? []).filter(
              (v) => v.id !== result.version.id,
            ),
          ],
        }),
        { revalidate: false },
      );
      setNotice({
        kind: result.cacheRefreshPending ? "warning" : "success",
        message: result.cacheRefreshPending
          ? text(
              "Đã xuất bản. Cần thử làm mới bộ nhớ đệm.",
              "Published. Retry the cache refresh.",
            )
          : action === "restore"
            ? text(
                "Đã xuất bản phiên bản đã chọn. Bản nháp được giữ nguyên.",
                "Selected version published. Your draft is retained.",
              )
            : text("Đã xuất bản portfolio.", "Portfolio published."),
      });
      return true;
    }));
  }
  async function refreshCache() {
    return !!(await run("refresh", async () => {
      const result = await send<{ cacheRefreshPending: boolean }>("refresh");
      setCachePending(result.cacheRefreshPending);
      setNotice({
        kind: result.cacheRefreshPending ? "warning" : "success",
        message: result.cacheRefreshPending
          ? text(
              "Chưa thể làm mới bộ nhớ đệm. Thử lại sau.",
              "Cache refresh is still pending. Retry later.",
            )
          : text(
              "Đã yêu cầu làm mới trang công khai.",
              "Public page cache refreshed.",
            ),
      });
      return !result.cacheRefreshPending;
    }));
  }
  async function reloadLatest() {
    return !!(await run("reload", async () => {
      const result = await fetchJSON<{ site: PortfolioSite | null }>(
        "/api/portfolio/draft",
      );
      setLastSavedOverride(undefined);
      setSiteOverride(result.site);
      setLocalDoc(null);
      setConflict(false);
      await draftStore.mutate(result, { revalidate: false });
      void historyStore.mutate().catch(() => { /* historyError exposes failure without undoing a successful reload. */ });
      setNotice({
        kind: "success",
        message: text("Đã tải bản nháp mới nhất.", "Latest draft loaded."),
      });
      return true;
    }));
  }
  async function upload(file: File) {
    return run("upload", async () => {
      if (file.size > 2097152) throw new RequestError(413, "image_too_large");
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
        throw new RequestError(400, "invalid_image");
      const result = await fetchJSON<{ media: PortfolioMedia }>(
        "/api/portfolio/media",
        { method: "POST", headers: { "Content-Type": file.type }, body: file },
      );
      await mediaStore.mutate(
        (previous) => ({
          media: [
            result.media,
            ...(previous?.media ?? []).filter((m) => m.id !== result.media.id),
          ],
        }),
        { revalidate: false },
      );
      setNotice({
        kind: "success",
        message: text(
          "Đã tải ảnh. Chọn ảnh trong trường nội dung rồi lưu bản nháp.",
          "Image uploaded. Select it in an image field and save your draft.",
        ),
      });
      return result.media;
    });
  }
  async function reconcile() {
    return !!(await run("reconcile", async () => {
      await send("media/reconcile");
      await mediaStore.mutate();
      setNotice({
        kind: "success",
        message: text(
          "Đã phục hồi các lượt tải ảnh bị gián đoạn.",
          "Interrupted uploads recovered.",
        ),
      });
      return true;
    }));
  }
  const value: PortfolioEditorState = {
    doc,
    setDoc,
    updateResume,
    locale,
    setLocale,
    language,
    site,
    revision: site?.revision ?? 0,
    published: site?.published_id ?? null,
    currentPublished,
    publishedDraftRevision: currentPublished?.draft_revision ?? null,
    history,
    media,
    dirty,
    hasUnpublishedChanges,
    publicationComparisonKnown,
    lastSaved:
      lastSavedOverride === undefined
        ? (site?.updated_at ?? site?.created_at ?? null)
        : lastSavedOverride,
    historyLoading: historyStore.isLoading,
    mediaLoading: mediaStore.isLoading,
    loading: draftStore.isLoading,
    error: draftStore.error ?? null,
    historyError: historyStore.error ?? null,
    mediaError: mediaStore.error ?? null,
    busy: busyAction !== null,
    busyAction,
    conflict,
    cachePending,
    fieldErrors,
    notice,
    clearNotice: () => {
      setNotice(null);
      setFieldErrors({});
    },
    saveDraft,
    publish: () => publication("publish"),
    restore: (id) => publication("restore", id),
    refreshCache,
    reloadLatest,
    upload,
    reconcile,
    retry: async () => {
      await Promise.all([
        draftStore.mutate(),
        historyStore.mutate(),
        mediaStore.mutate(),
      ]);
    },
  };
  return <Context value={value}>{children}</Context>;
}
