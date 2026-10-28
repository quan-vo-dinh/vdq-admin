"use client";
import { createContext, useContext, useState, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field";
import {
  parseDocument,
  iconNames,
  type PortfolioDocument,
} from "@/lib/portfolio/model";
import initial from "@/lib/portfolio/initial-content.json";
type Site = {
  draft: PortfolioDocument;
  revision: number;
  published_id: string | null;
};
async function fetcher(url: string) {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`Could not load (${r.status})`);
  return r.json();
}
const Context = createContext<ReturnType<typeof usePortfolioStore> | null>(
  null,
);
function usePortfolioStore() {
  return useSWR<{ site: Site | null }>("/api/portfolio/draft", fetcher);
}
export function PortfolioEditor() {
  const store = usePortfolioStore();
  return (
    <Context value={store}>
      <EditorLoader />
    </Context>
  );
}
function EditorLoader() {
  const s = useContext(Context)!;
  if (s.error)
    return (
      <div role="alert">
        Could not load portfolio.{" "}
        <Button onClick={() => s.mutate()}>Retry</Button>
      </div>
    );
  if (!s.data) return <p aria-busy>Loading portfolio…</p>;
  return <Editor site={s.data.site} />;
}
type Value =
  string | number | boolean | null | Value[] | { [key: string]: Value };
const labels: Record<string, string> = {
  avatarUrl: "Avatar",
  logoUrl: "Logo",
  image: "Project image",
  href: "Link URL",
  url: "URL",
  summary: "About (Markdown)",
  description: "Description",
  copy: "Section labels and SEO",
  navbar: "Dock navigation",
  contact: "Contact",
  companyContext: "Company context",
  logoClassName: "Logo treatment",
  end: "End date (blank means present)",
};
function caption(s: string) {
  return (
    labels[s] ??
    s.replace(/([A-Z])/g, " $1").replace(/^./, (x) => x.toUpperCase())
  );
}
function template(key: string): Value {
  const d = initial.locales.en as unknown as Record<string, Value>;
  if (key === "social")
    return structuredClone(
      (d.contact as Record<string, Value>).social as Value[],
    )[0];
  if (key === "links")
    return {
      id: crypto.randomUUID(),
      type: "Website",
      href: "https://",
      icon: "HomeIcon",
    };
  return structuredClone((d[key] as Value[])?.[0] ?? "");
}
function blank(value: Value): Value {
  if (typeof value === "string") return "";
  if (typeof value === "boolean") return false;
  if (Array.isArray(value)) return [];
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [
        k,
        k === "id" ? crypto.randomUUID() : k === "icon" ? v : blank(v),
      ]),
    );
  return value;
}
function Fields({
  value,
  onChange,
  path,
  media,
}: {
  value: Value;
  onChange: (v: Value) => void;
  path: string;
  media: { id: string }[];
}) {
  if (Array.isArray(value)) {
    if (
      value.every((x) => typeof x === "string") &&
      ["technologies", "badges"].includes(path.split(".").at(-1)!)
    )
      return (
        <Field>
          <FieldLabel>{caption(path.split(".").at(-1)!)}</FieldLabel>
          <Textarea
            value={(value as string[]).join("\n")}
            onChange={(e) =>
              onChange(e.target.value.split("\n").filter(Boolean))
            }
          />
        </Field>
      );
    return (
      <div className="flex flex-col gap-4">
        {value.map((v, i) => (
          <details
            key={
              typeof v === "object" && v && !Array.isArray(v) ? String(v.id) : i
            }
            className="rounded-lg border p-4"
            open={value.length < 2}
          >
            <summary className="cursor-pointer font-medium">
              {typeof v === "object" && v && !Array.isArray(v)
                ? String(
                    v.name ||
                      v.title ||
                      v.company ||
                      v.school ||
                      v.label ||
                      `Item ${i + 1}`,
                  )
                : `Item ${i + 1}`}
            </summary>
            <div className="mt-3 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!i}
                onClick={() => {
                  const a = [...value];
                  [a[i - 1], a[i]] = [a[i], a[i - 1]];
                  onChange(a);
                }}
              >
                Up
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={i === value.length - 1}
                onClick={() => {
                  const a = [...value];
                  [a[i + 1], a[i]] = [a[i], a[i + 1]];
                  onChange(a);
                }}
              >
                Down
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onChange(value.filter((_, j) => i !== j))}
              >
                Delete
              </Button>
            </div>
            <div className="mt-4">
              <Fields
                value={v}
                path={`${path}.${i}`}
                media={media}
                onChange={(v) =>
                  onChange(value.map((x, j) => (i === j ? v : x)))
                }
              />
            </div>
          </details>
        ))}
        <Button
          variant="outline"
          onClick={() =>
            onChange([...value, blank(template(path.split(".").at(-1)!))])
          }
        >
          Add {caption(path.split(".").at(-1)!)}
        </Button>
      </div>
    );
  }
  if (value && typeof value === "object")
    return (
      <FieldGroup>
        {Object.entries(value)
          .filter(([k]) => k !== "id")
          .map(([key, v]) => (
            <div key={key}>
              {typeof v === "object" ? (
                <details open className="rounded-lg border p-4">
                  <summary className="mb-4 cursor-pointer font-semibold">
                    {caption(key)}
                  </summary>
                  <Fields
                    value={v}
                    path={`${path}.${key}`}
                    media={media}
                    onChange={(n) => onChange({ ...value, [key]: n })}
                  />
                </details>
              ) : (
                <Field>
                  <FieldLabel htmlFor={`${path}.${key}`}>
                    {caption(key)}
                  </FieldLabel>
                  {typeof v === "boolean" ? (
                    <input
                      id={`${path}.${key}`}
                      type="checkbox"
                      checked={v}
                      onChange={(e) =>
                        onChange({ ...value, [key]: e.target.checked })
                      }
                    />
                  ) : key === "icon" ? (
                    <select
                      className="rounded border p-2"
                      id={`${path}.${key}`}
                      value={String(v)}
                      onChange={(e) =>
                        onChange({ ...value, [key]: e.target.value })
                      }
                    >
                      {iconNames.map((k) => (
                        <option key={k}>{k}</option>
                      ))}
                    </select>
                  ) : ["avatarUrl", "logoUrl", "image"].includes(key) ? (
                    <>
                      <select
                        className="rounded border p-2"
                        id={`${path}.${key}`}
                        value={String(v)}
                        onChange={(e) =>
                          onChange({ ...value, [key]: e.target.value })
                        }
                      >
                        <option value="">No image</option>
                        {[
                          "me.jpg",
                          "iSOFT_LOGO-nobackground.png",
                          "wm.png",
                          "geekup.jpg",
                          "uit.png",
                          "qrtable.webp",
                          "multi-vendor.webp",
                          "kick.webp",
                          "car-garage.webp",
                          "meta.png",
                          "ibm.png",
                        ].map((s) => (
                          <option value={`/${s}`} key={s}>
                            {s}
                          </option>
                        ))}
                        {media.map((m) => (
                          <option value={`media:${m.id}`} key={m.id}>
                            Upload {m.id.slice(0, 8)}
                          </option>
                        ))}
                      </select>
                    </>
                  ) : typeof v === "string" &&
                    (v.length > 140 ||
                      ["summary", "description"].includes(key)) ? (
                    <Textarea
                      id={`${path}.${key}`}
                      rows={key === "summary" ? 8 : 4}
                      value={v}
                      onChange={(e) =>
                        onChange({ ...value, [key]: e.target.value })
                      }
                    />
                  ) : (
                    <Input
                      id={`${path}.${key}`}
                      value={String(v ?? "")}
                      onChange={(e) =>
                        onChange({ ...value, [key]: e.target.value })
                      }
                    />
                  )}
                </Field>
              )}
            </div>
          ))}
      </FieldGroup>
    );
  return null;
}
function Editor({ site }: { site: Site | null }) {
  const store = useContext(Context)!;
  const [doc, setDoc] = useState<PortfolioDocument>(
    () => structuredClone(site?.draft ?? initial) as PortfolioDocument,
  );
  const [saved, setSaved] = useState(JSON.stringify(site?.draft ?? initial));
  const [revision, setRevision] = useState(site?.revision ?? 0);
  const [published, setPublished] = useState(site?.published_id ?? null);
  const [locale, setLocale] = useState<"vi" | "en">("vi"),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [cachePending, setCachePending] = useState(false);
  const history = useSWR<{
    versions: { id: string; created_at: string; draft_revision: number }[];
  }>("/api/portfolio/history", fetcher);
  const media = useSWR<{ media: { id: string }[] }>(
    "/api/portfolio/media",
    fetcher,
  );
  const dirty = JSON.stringify(doc) !== saved;
  useEffect(() => {
    if (!dirty) return;
    const guard = (event: BeforeUnloadEvent) => event.preventDefault();
    const navigate = (event: MouseEvent) => {
      const link = (event.target as Element).closest?.("a[href]");
      if (
        !(link instanceof HTMLAnchorElement) ||
        link.target === "_blank" ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        link.href === window.location.href ||
        (link.hash && link.pathname === window.location.pathname)
      )
        return;
      if (!window.confirm("Discard unsaved portfolio changes?")) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", guard);
    document.addEventListener("click", navigate, true);
    return () => {
      window.removeEventListener("beforeunload", guard);
      document.removeEventListener("click", navigate, true);
    };
  }, [dirty]);

  async function send(action: string, body: unknown) {
    const r = await fetch(`/api/portfolio/${action}`, {
      method: action === "draft" ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await r.json();
    if (!r.ok)
      throw new Error(
        r.status === 409
          ? "Another tab changed the draft. Reload latest before saving."
          : (result.detail ?? result.code ?? "Request failed"),
      );
    return result;
  }
  async function act(action: string, versionId?: string) {
    setBusy(true);
    setMessage("");
    try {
      if (action === "draft") {
        const document = parseDocument(doc);
        const r = await send("draft", { document, expectedRevision: revision });
        setRevision(r.site.revision);
        setSaved(JSON.stringify(document));
        setDoc(document);
        await store.mutate({ site: r.site }, false);
        setMessage("Draft saved. Public portfolio is unchanged.");
      } else {
        const r = await send(action, { expectedRevision: revision, versionId });
        setCachePending(r.cacheRefreshPending ?? false);
        if (r.version) {
          setRevision(r.site.revision);
          setPublished(r.version.id);
          await history.mutate();
        }
        setMessage(
          action === "restore"
            ? "Selected version published. Draft retained."
            : action === "refresh"
              ? "Cache refresh requested."
              : "Portfolio published.",
        );
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }
  // Mirror ID additions/removals between locales; localized text remains independently editable.
  function updateLocale(next: Value) {
    const nextDoc = structuredClone(doc);
    nextDoc.locales[locale] =
      next as unknown as PortfolioDocument["locales"]["vi"];
    const other = locale === "vi" ? "en" : "vi";
    for (const key of [
      "work",
      "education",
      "certifications",
      "skills",
      "projects",
      "navbar",
    ] as const) {
      const items = nextDoc.locales[locale][key];
      const opposite = nextDoc.locales[other][key];
      (nextDoc.locales[other][key] as unknown) = items.map(
        (x) => opposite.find((y) => y.id === x.id) ?? structuredClone(x),
      );
    }
    const socials = nextDoc.locales[locale].contact.social;
    nextDoc.locales[other].contact.social = socials.map(
      (s) =>
        nextDoc.locales[other].contact.social.find((x) => x.id === s.id) ??
        structuredClone(s),
    );
    setDoc(nextDoc);
  }
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Portfolio CMS</h1>
          <p>
            Draft revision {revision} · {dirty ? "Unsaved changes" : "Saved draft"} ·{" "}
            {published ? `Live version ${published.slice(0,8)}` : "Not published"}
          </p>
        </div>
        <Link href="/portfolio" target="_blank">
          View public portfolio
        </Link>
      </div>
      <div className="sticky top-0 z-20 flex flex-wrap gap-2 rounded-lg border bg-background p-3">
        <Button disabled={busy} onClick={() => act("draft")}>
          Save draft
        </Button>
        <Link
          href="/apps/portfolio/preview"
          target="_blank"
          className="rounded border px-4 py-2"
        >
          Preview saved draft
        </Link>
        <Button
          disabled={busy || dirty || revision === 0}
          onClick={() => act("publish")}
        >
          Publish
        </Button>
        {cachePending && (
          <Button onClick={() => act("refresh")} disabled={busy}>
            Retry cache refresh
          </Button>
        )}
        <Button
          variant="outline"
          disabled={busy}
          onClick={async () => {
            try {
              const latest = await store.mutate();
              if (latest?.site) {
                setDoc(structuredClone(latest.site.draft));
                setSaved(JSON.stringify(latest.site.draft));
                setRevision(latest.site.revision);
                setMessage("Latest draft loaded.");
              }
            } catch {
              setMessage("Reload failed.");
            }
          }}
        >
          Discard and reload latest
        </Button>
      </div>
      {message && (
        <p role="status" className="whitespace-pre-wrap rounded border p-4">
          {message}
        </p>
      )}
      <p className="text-muted-foreground">
        Save before preview or publish. Both locales share item IDs; edit each
        translation independently. Historical education dates are preserved from
        the original portfolio (VI 09/2026, EN Oct 2026).
      </p>
      <details className="rounded-lg border p-4">
        <summary className="font-semibold">
          Section order and visibility
        </summary>
        {doc.sections.map((s, i) => (
          <div className="mt-3 flex gap-3" key={s.id}>
            <input
              aria-label={`Show ${s.id}`}
              type="checkbox"
              checked={s.visible}
              onChange={(e) =>
                setDoc({
                  ...doc,
                  sections: doc.sections.map((x) =>
                    x.id === s.id ? { ...x, visible: e.target.checked } : x,
                  ),
                })
              }
            />
            <span className="w-32">{caption(s.id)}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={!i}
              onClick={() => {
                const a = [...doc.sections];
                [a[i - 1], a[i]] = [a[i], a[i - 1]];
                setDoc({ ...doc, sections: a });
              }}
            >
              Up
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={i === 7}
              onClick={() => {
                const a = [...doc.sections];
                [a[i + 1], a[i]] = [a[i], a[i + 1]];
                setDoc({ ...doc, sections: a });
              }}
            >
              Down
            </Button>
          </div>
        ))}
      </details>
      <div className="flex gap-2">
        {(["vi", "en"] as const).map((l) => (
          <Button
            key={l}
            variant={locale === l ? "default" : "outline"}
            onClick={() => setLocale(l)}
          >
            {l === "vi" ? "Tiếng Việt" : "English"}
          </Button>
        ))}
      </div>
      <Fields
        value={doc.locales[locale] as unknown as Value}
        path={locale}
        media={media.data?.media ?? []}
        onChange={updateLocale}
      />
      <details className="rounded-lg border p-4">
        <summary className="font-semibold">Media library</summary>
        <Field className="mt-4">
          <FieldLabel htmlFor="portfolio-upload">
            Upload PNG, JPEG or WebP (2 MB; 16 megapixels maximum)
          </FieldLabel>
          <Input
            id="portfolio-upload"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={busy}
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setBusy(true);
              try {
                const r = await fetch("/api/portfolio/media", {
                  method: "POST",
                  headers: { "Content-Type": f.type },
                  body: f,
                });
                if (!r.ok) throw new Error("Upload rejected");
                await media.mutate();
                setMessage(
                  "Uploaded. Select the image in an image field and save draft.",
                );
              } catch {
                setMessage("Upload failed. Check file format and size.");
              } finally {
                setBusy(false);
              }
            }}
          />
        </Field>
        <Button
          className="mt-3"
          variant="outline"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const r = await fetch("/api/portfolio/media/reconcile", {
                method: "POST",
              });
              if (!r.ok) throw new Error();
              await media.mutate();
              setMessage("Media library reconciled.");
            } catch {
              setMessage("Reconciliation failed; retry later.");
            } finally {
              setBusy(false);
            }
          }}
        >
          Recover interrupted uploads
        </Button>
        <p className="mt-3">
          Uploaded assets stay private until referenced by published content.
          Retained versions keep their media.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {media.data?.media.map((m) => (
            <figure key={m.id}>
              <img
                src={`/api/portfolio/media/${m.id}`}
                alt={`Portfolio upload ${m.id.slice(0, 8)}`}
                className="h-24 w-full object-contain"
              />
              <figcaption className="text-xs">{m.id.slice(0, 8)}</figcaption>
            </figure>
          ))}
        </div>
      </details>
      <details className="rounded-lg border p-4">
        <summary className="font-semibold">Published version history</summary>
        {history.error ? (
          <p role="alert">
            History unavailable.{" "}
            <Button onClick={() => history.mutate()}>Retry</Button>
          </p>
        ) : (
          history.data?.versions.map((v) => (
            <div
              className="mt-3 flex flex-wrap items-center justify-between gap-2"
              key={v.id}
            >
              <span>
                {new Date(v.created_at).toLocaleString()} · draft revision{" "}
                {v.draft_revision}
                {v.id === published ? " · Current" : ""}
              </span>
              <Button
                disabled={busy || dirty}
                variant="outline"
                onClick={() => act("restore", v.id)}
              >
                Publish this version
              </Button>
            </div>
          ))
        )}
      </details>
    </div>
  );
}
