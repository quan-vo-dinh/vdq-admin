"use client";
import {CodexConnections} from "./codex";
import { useState } from "react";
import useSWR from "swr";
import { developerFetch, useDeveloper } from "@/app/context/developer-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { useDeveloperLocale } from "../shared";
import type { LiveConnection } from "@/lib/developer/live/types";
type Connection = Omit<LiveConnection, "credential" | "inboxCredential"> & {
  hasInboxCredential: boolean;
};
export function LiveConnections() {
  const { text } = useDeveloperLocale(),
    { reload } = useDeveloper();
  const {
    data: connections = [],
    error,
    mutate,
  } = useSWR<Connection[]>("/api/developer/connections", developerFetch);
  const [editing, setEditing] = useState<string | null>(null),
    [name, setName] = useState(""),
    [token, setToken] = useState(""),
    [inboxToken, setInboxToken] = useState(""),
    [work, setWork] = useState(false),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const [repos, setRepos] = useState<{ id: number; name: string }[]>([]),
    [selected, setSelected] = useState<string[]>([]),
    [page, setPage] = useState<number | null>(1);
  async function action(fn: () => Promise<void>) {
    setBusy(true);
    setNotice("");
    try {
      await fn();
      await mutate();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "unavailable");
    } finally {
      setBusy(false);
    }
  }
  async function loadRepos(id: string, next = 1) {
    const response = await developerFetch(
      `/api/developer/connections?id=${id}&repositories=1&page=${next}`,
    );
    setRepos((old) =>
      next === 1 ? response.repositories : [...old, ...response.repositories],
    );
    setPage(response.nextPage);
  }
  async function save() {
    await action(async () => {
      const result = await developerFetch("/api/developer/connections", {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify({
          id: editing ?? undefined,
          name,
          token: token || undefined,
          inboxToken: inboxToken || undefined,
          group: work ? "work" : "personal",
          repositories: selected,
        }),
      });
      setEditing(result.id);
      setToken("");
      setInboxToken("");
      await loadRepos(result.id);
    });
  }
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold">
        {text("Nguồn dữ liệu & kết nối", "Data sources & connections")}
      </h1>
      {(notice || error) && (
        <p role="alert" className="text-sm text-destructive">
          {notice || error?.message}
        </p>
      )}
      <div className="space-y-3">
        {connections.map((c) => (
          <div
            key={c.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
          >
            <div className="min-w-0">
              <p className="font-medium">
                {c.name} · @{c.login}
              </p>
              <p className="text-xs text-muted-foreground">
                {c.repositories.length} repositories · {c.observedAt ?? "—"}
                {c.error ? ` · ${c.error}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => {
                  setEditing(c.id);
                  setName(c.name);
                  setWork(c.group === "work");
                  setSelected(c.repositories);
                  setToken("");
                  setInboxToken("");
                  void action(() => loadRepos(c.id));
                }}
              >
                {text("Thiết lập", "Configure")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  void action(async () => {
                    await developerFetch("/api/developer/connections", {
                      method: "PATCH",
                      body: JSON.stringify({ id: c.id, paused: !c.paused }),
                    });
                  })
                }
              >
                {c.paused
                  ? text("Tiếp tục", "Resume")
                  : text("Tạm dừng", "Pause")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  void action(async () => {
                    await developerFetch("/api/developer/connections", {
                      method: "DELETE",
                      body: JSON.stringify({ id: c.id }),
                    });
                    setEditing(null);
                    reload();
                  })
                }
              >
                {text("Xóa kết nối", "Remove connection")}
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-3 rounded-xl border p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">
            {editing
              ? text("Thiết lập GitHub", "Configure GitHub")
              : text("Kết nối GitHub", "Connect GitHub")}
          </h2>
          {editing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditing(null);
                setName("");
                setSelected([]);
                setRepos([]);
                setToken("");
                setInboxToken("");
              }}
            >
              {text("Thêm tài khoản", "Add account")}
            </Button>
          )}
        </div>
        <Field>
          <FieldLabel htmlFor="github-name">
            {text("Tên hiển thị", "Display name")}
          </FieldLabel>
          <Input
            id="github-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="github-token">
            {text("Token repository", "Repository token")}
          </FieldLabel>
          <Input
            id="github-token"
            type="password"
            autoComplete="off"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="github-inbox-token">
            {text(
              "Token classic cho Inbox (notifications)",
              "Inbox classic token (notifications)",
            )}
          </FieldLabel>
          <Input
            id="github-inbox-token"
            type="password"
            autoComplete="off"
            value={inboxToken}
            onChange={(e) => setInboxToken(e.target.value)}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={work}
            onChange={(e) => setWork(e.target.checked)}
          />
          {text("Tài khoản công việc", "Work account")}
        </label>
        {editing && (
          <div className="max-h-64 space-y-2 overflow-auto rounded-lg border p-3">
            {repos.map((repo) => (
              <label key={repo.id} className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selected.includes(repo.name)}
                  onChange={(e) =>
                    setSelected((old) =>
                      e.target.checked
                        ? [...old, repo.name]
                        : old.filter((r) => r !== repo.name),
                    )
                  }
                />
                <span className="break-all">{repo.name}</span>
              </label>
            ))}
            {page && (
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => void action(() => loadRepos(editing, page))}
              >
                {text("Tải repository", "Load repositories")}
              </Button>
            )}
          </div>
        )}
        <Button
          disabled={busy || !name || (!editing && !token)}
          onClick={() => void save()}
        >
          {busy
            ? text("Đang kiểm tra…", "Checking…")
            : text("Xác minh & lưu", "Verify & save")}
        </Button>
        {editing && (
          <Button
            className="ml-2"
            variant="outline"
            disabled={busy}
            onClick={reload}
          >
            {text("Đồng bộ dữ liệu", "Sync data")}
          </Button>
        )}
      </div>
      <CodexConnections />
    </div>
  );
}
