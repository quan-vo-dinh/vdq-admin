"use client";
import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { developerFetch } from "@/app/context/developer-context";
import { Choice, useDeveloperLocale } from "../shared";
import type { Database } from "@/types/database";
type Account = Database["public"]["Tables"]["codex_accounts"]["Row"];
type Device = Pick<
  Database["public"]["Tables"]["codex_devices"]["Row"],
  | "id"
  | "account_id"
  | "name"
  | "profile"
  | "version"
  | "paused"
  | "revoked_at"
  | "heartbeat_at"
  | "observed_at"
  | "last_error"
  | "pending_identity"
  | "pending_label"
  | "sync_requested_at"
> & { state: string };
export function CodexConnections() {
  const { text, language } = useDeveloperLocale();
  const { data, mutate, error } = useSWR<{
    accounts: Account[];
    devices: Device[];
  }>("/api/developer/codex", developerFetch, { refreshInterval: 5000 });
  const [name, setName] = useState(""),
    [group, setGroup] = useState("personal"),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [pair, setPair] = useState<{
      code: string;
      expiresAt: string;
      name: string;
    } | null>(null),
    [rename, setRename] = useState<{
      kind: "device" | "account";
      id: string;
      name: string;
      group: string;
    } | null>(null),
    [confirm, setConfirm] = useState<Device | null>(null),
    [revoke, setRevoke] = useState<Device | null>(null),
    [profile, setProfile] = useState("personal"),
    [erase, setErase] = useState<Account | null>(null);
  const stateLabels: Record<string, string> = {
    online: text("Online", "Online"),
    offline: text("Mac chưa kết nối", "Mac offline"),
    waiting: text("Chờ companion", "Waiting for companion"),
    paused: text("Tạm dừng", "Paused"),
    revoked: text("Đã thu hồi", "Revoked"),
    confirmation_required: text("Cần xác nhận tài khoản", "Confirm account"),
    identity_confirmation_required: text(
      "Cần xác nhận tài khoản",
      "Confirm account",
    ),
    login_required: text("Cần đăng nhập Codex", "Codex sign-in required"),
    collection_error: text("Lỗi lấy số liệu Codex", "Codex collection failed"),
    error: text("Lỗi thu thập", "Collection error"),
  };
  const time = (value: string | null) =>
    value
      ? new Date(value).toLocaleString(language === "vi" ? "vi-VN" : "en-GB", {
          timeZone: "Asia/Ho_Chi_Minh",
        })
      : "—";
  const errors: Record<string, string> = {
    identity_changed: text(
      "Danh tính trên Mac vừa thay đổi. Đóng popup rồi kiểm tra lại.",
      "Mac identity changed. Reopen the dialog and verify.",
    ),
    new_account_required: text(
      "Danh tính khác tài khoản cũ. Chọn tạo tài khoản mới bên dưới.",
      "Different identity. Create a new account below.",
    ),
    identity_already_linked: text(
      "Danh tính này đã có tài khoản. Chọn nút liên kết với tài khoản đó.",
      "This identity is already linked. Choose its existing account.",
    ),
    account_paused: text(
      "Tiếp tục tài khoản trước khi ghép Mac.",
      "Resume the account before pairing.",
    ),
    pause_account_first: text(
      "Tạm dừng tài khoản trước khi xóa lịch sử.",
      "Pause the account before deleting history.",
    ),
  };
  async function action(body: Record<string, unknown>) {
    setBusy(true);
    setNotice("");
    try {
      const result = await developerFetch("/api/developer/codex", {
        method: "POST",
        body: JSON.stringify(body),
      });
      await mutate();
      return result;
    } catch (error) {
      setNotice(
        error instanceof Error
          ? (errors[error.message] ?? error.message)
          : "unavailable",
      );
      return null;
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-4 rounded-xl border p-4" aria-label="Codex">
      <header>
        <h2 className="font-semibold">Codex · ChatGPT</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {text(
            "Quản lý tài khoản cá nhân, công việc và các Mac gửi số liệu.",
            "Manage personal/work accounts and reporting Macs.",
          )}
        </p>
      </header>
      {(notice || error) && (
        <p role="alert" className="text-sm text-destructive">
          {notice || error?.message}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <Field>
          <FieldLabel htmlFor="codex-account-name">
            {text("Tên tài khoản mới", "New account name")}
          </FieldLabel>
          <Input
            id="codex-account-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
          />
        </Field>
        <Choice
          label={text("Nhóm tài khoản", "Account group")}
          value={group}
          onChange={setGroup}
          items={[
            { value: "personal", label: text("Cá nhân", "Personal") },
            { value: "work", label: text("Công việc", "Work") },
          ]}
        />
        <Button
          disabled={busy || !name.trim()}
          onClick={() =>
            void action({ action: "create_account", name, group }).then((r) => {
              if (r) setName("");
            })
          }
        >
          {text("Thêm Codex", "Add Codex")}
        </Button>
      </div>
      {(data?.accounts ?? []).map((account) => (
        <article key={account.id} className="space-y-3 rounded-lg border p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-medium">
                {account.name}{" "}
                <Badge variant="outline">
                  {account.account_group === "work"
                    ? text("Công việc", "Work")
                    : text("Cá nhân", "Personal")}
                </Badge>
              </h3>
              <p className="break-all text-xs text-muted-foreground">
                {account.identity_label ??
                  text(
                    "Chưa xác nhận danh tính",
                    "Identity not confirmed",
                  )}{" "}
                · {account.plan ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                Usage: {time(account.usage_observed_at)} · Quota:{" "}
                {time(account.quota_observed_at)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() =>
                  setRename({
                    kind: "account",
                    id: account.id,
                    name: account.name,
                    group: account.account_group,
                  })
                }
              >
                {text("Sửa", "Edit")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() =>
                  void action({
                    action: "update_account",
                    id: account.id,
                    paused: !account.paused,
                  })
                }
              >
                {account.paused
                  ? text("Tiếp tục", "Resume")
                  : text("Tạm dừng", "Pause")}
              </Button>
              {account.paused && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => setErase(account)}
                >
                  {text("Xóa lịch sử", "Delete history")}
                </Button>
              )}
              <Button
                size="sm"
                disabled={busy || account.paused}
                onClick={() =>
                  void action({ action: "pair", accountId: account.id }).then(
                    (result) => {
                      if (result) {
                        setProfile(`codex-${account.account_group}-${account.id.slice(0,8)}`);
                        setPair({ ...result, name: account.name });
                      }
                    },
                  )
                }
              >
                {text("Ghép Mac", "Pair Mac")}
              </Button>
            </div>
          </div>
          {(data?.devices ?? [])
            .filter((d) => d.account_id === account.id)
            .map((device) => (
              <div key={device.id} className="space-y-2 border-t pt-3">
                <div className="flex flex-wrap justify-between gap-2">
                  <p className="text-sm font-medium">{device.name}</p>
                  <Badge variant="secondary">
                    {stateLabels[device.state] ?? device.state}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Profile: {device.profile ?? "—"} · Codex:{" "}
                  {device.version ?? "—"} · {text("Liên lạc", "Heartbeat")}:{" "}
                  {time(device.heartbeat_at)}
                </p>
                {device.sync_requested_at && (
                  <p className="text-xs text-muted-foreground">
                    {text(
                      "Đã yêu cầu đồng bộ; chờ Mac phản hồi.",
                      "Sync requested; awaiting Mac.",
                    )}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {device.pending_identity && !device.revoked_at && (
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() => setConfirm(device)}
                    >
                      {text("Xác nhận danh tính", "Confirm identity")}
                    </Button>
                  )}
                  {!device.revoked_at && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() =>
                          void action({ action: "sync", id: device.id })
                        }
                      >
                        {text("Đồng bộ ngay", "Sync now")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() =>
                          setRename({
                            kind: "device",
                            id: device.id,
                            name: device.name,
                            group: account.account_group,
                          })
                        }
                      >
                        {text("Đổi tên Mac", "Rename Mac")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() =>
                          void action({
                            action: "pause_device",
                            id: device.id,
                            paused: !device.paused,
                          })
                        }
                      >
                        {device.paused
                          ? text("Tiếp tục", "Resume")
                          : text("Tạm dừng", "Pause")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() => setRevoke(device)}
                      >
                        {text("Thu hồi", "Revoke")}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
        </article>
      ))}
      <Dialog
        open={pair !== null}
        onOpenChange={(open) => {
          if (!open) {
            if (pair)
              void action({ action: "cancel_pairing", code: pair.code });
            setPair(null);
          }
        }}
      >
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>
              {text("Ghép Mac", "Pair Mac")} · {pair?.name}
            </DialogTitle>
            <DialogDescription>
              {text(
                "Mã dùng một lần, hết hạn sau 10 phút. Mở Terminal tại thư mục dự án dashboard trên Mac.",
                "One-use code expires in 10 minutes. Open Terminal in the dashboard project on your Mac.",
              )}
            </DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="codex-profile">Profile companion</FieldLabel>
            <Input
              id="codex-profile"
              value={profile}
              pattern="[A-Za-z0-9_-]{1,60}"
              onChange={(e) =>
                setProfile(
                  e.target.value.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 60),
                )
              }
            />
          </Field>
          <pre className="overflow-auto whitespace-pre-wrap break-all rounded-lg bg-muted p-3 text-xs">
            {pair &&
              `DEVELOPER_ORIGIN="${typeof window !== "undefined" ? window.location.origin : ""}" DEVELOPER_PROFILE="${profile || "personal"}" DEVELOPER_CODEX_HOME="$HOME/.developer-companion/codex-${profile || "personal"}" pnpm developer:companion setup`}
          </pre>
          <p className="text-sm">
            {text(
              "Khi Terminal hỏi mã, nhập:",
              "When Terminal asks for a code, enter:",
            )}{" "}
            <code className="break-all font-semibold">{pair?.code}</code>
          </p>
          <p className="text-xs text-muted-foreground">
            {text(
              "Chạy lệnh trên, nhập y khi được hỏi đăng nhập và chọn đúng tài khoản/workspace này trong trình duyệt. Khi Terminal hỏi mã, dán mã ở trên. Sau đó quay lại đây bấm Xác nhận danh tính. Profile này lưu đăng nhập riêng, không thay tài khoản Codex bạn đang sử dụng.",
              "Run the command, enter y to sign in, and select this account/workspace in the browser. Paste the code when Terminal asks. Then confirm the detected identity here. This profile keeps a separate sign-in from your active Codex account.",
            )}
          </p>
          <p className="text-xs text-muted-foreground">{text("Sau khi xác nhận, chạy lệnh sau để tự cập nhật cả khi bạn dùng tài khoản khác:","After confirmation, run this to keep updating while you use another account:")}</p>
          <pre className="overflow-auto whitespace-pre-wrap break-all rounded-lg bg-muted p-3 text-xs">{pair && `DEVELOPER_ORIGIN="${typeof window !== "undefined" ? window.location.origin : ""}" DEVELOPER_PROFILE="${profile || "personal"}" DEVELOPER_CODEX_HOME="$HOME/.developer-companion/codex-${profile || "personal"}" pnpm developer:companion install`}</pre>
          <p className="text-xs">
            {text("Hết hạn", "Expires")}: {pair ? time(pair.expiresAt) : "—"}
          </p>
        </DialogContent>
      </Dialog>
      <Dialog
        open={rename !== null}
        onOpenChange={(open) => {
          if (!open) setRename(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {text("Sửa tên và nhóm", "Edit name and group")}
            </DialogTitle>
            <DialogDescription>
              {text(
                "Thay đổi tên hiển thị; không thay đăng nhập Codex.",
                "Changes the display name, not your Codex sign-in.",
              )}
            </DialogDescription>
          </DialogHeader>
          <Input
            aria-label={text("Tên", "Name")}
            value={rename?.name ?? ""}
            maxLength={80}
            onChange={(e) =>
              setRename((old) =>
                old ? { ...old, name: e.target.value } : null,
              )
            }
          />
          {rename?.kind === "account" && (
            <Choice
              label={text("Nhóm", "Group")}
              value={rename.group}
              onChange={(group) =>
                setRename((old) => (old ? { ...old, group } : null))
              }
              items={[
                { value: "personal", label: text("Cá nhân", "Personal") },
                { value: "work", label: text("Công việc", "Work") },
              ]}
            />
          )}
          <Button
            disabled={busy || !rename?.name.trim()}
            onClick={() =>
              void action({
                action:
                  rename?.kind === "account"
                    ? "update_account"
                    : "rename_device",
                id: rename?.id,
                name: rename?.name,
                group: rename?.group,
              }).then((r) => {
                if (r) setRename(null);
              })
            }
          >
            {text("Lưu", "Save")}
          </Button>
        </DialogContent>
      </Dialog>
      <Dialog
        open={confirm !== null}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {text(
                "Xác nhận tài khoản Codex trên Mac",
                "Confirm Codex account on Mac",
              )}
            </DialogTitle>
            <DialogDescription>{confirm?.pending_label}</DialogDescription>
          </DialogHeader>
          <p className="text-sm">
            {text(
              "Xác nhận đây là tài khoản/workspace cần theo dõi. Khi profile chuyển sang danh tính khác, hãy tạo tài khoản mới để giữ lịch sử cũ riêng biệt.",
              "Confirm this is the account/workspace to track. Create a new account after an identity change to keep history separate.",
            )}
          </p>
          {(data?.accounts ?? [])
            .filter(
              (a) =>
                a.id !== confirm?.account_id &&
                a.identity_key === confirm?.pending_identity,
            )
            .map((a) => (
              <Button
                key={a.id}
                disabled={busy}
                onClick={() =>
                  void action({
                    action: "confirm_identity",
                    id: confirm?.id,
                    identity: confirm?.pending_identity,
                    targetAccountId: a.id,
                  }).then((r) => {
                    if (r) setConfirm(null);
                  })
                }
              >
                {text("Liên kết với", "Link to")} {a.name}
              </Button>
            ))}
          <Button
            disabled={busy}
            onClick={() =>
              void action({
                action: "confirm_identity",
                id: confirm?.id,
                identity: confirm?.pending_identity,
              }).then((r) => {
                if (r) setConfirm(null);
              })
            }
          >
            {text("Liên kết với tài khoản này", "Link to this account")}
          </Button>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() =>
              void action({
                action: "confirm_identity",
                id: confirm?.id,
                identity: confirm?.pending_identity,
                newAccount: true,
                name: confirm?.pending_label?.slice(0, 80) || "Codex",
                group:
                  data?.accounts.find((a) => a.id === confirm?.account_id)
                    ?.account_group ?? "personal",
              }).then((r) => {
                if (r) setConfirm(null);
              })
            }
          >
            {text(
              "Tạo tài khoản mới cho danh tính này",
              "Create a new account for this identity",
            )}
          </Button>
        </DialogContent>
      </Dialog>
      <Dialog
        open={revoke !== null}
        onOpenChange={(open) => {
          if (!open) setRevoke(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {text("Thu hồi quyền Mac", "Revoke Mac access")}
            </DialogTitle>
            <DialogDescription>
              {revoke?.name} ·{" "}
              {text(
                "Dừng nhận dữ liệu mới; giữ nguyên lịch sử.",
                "Stops new uploads; preserves history.",
              )}
            </DialogDescription>
          </DialogHeader>
          <Button
            disabled={busy}
            onClick={() =>
              void action({ action: "revoke", id: revoke?.id }).then((r) => {
                if (r) setRevoke(null);
              })
            }
          >
            {text("Xác nhận thu hồi", "Confirm revocation")}
          </Button>
        </DialogContent>
      </Dialog>
      <Dialog
        open={erase !== null}
        onOpenChange={(open) => {
          if (!open) setErase(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {text("Xóa lịch sử Codex", "Delete Codex history")}
            </DialogTitle>
            <DialogDescription>
              {erase?.name} ·{" "}
              {text(
                "Xóa dữ liệu ngày và quan sát quota đã lưu. Không thể hoàn tác. Khi tiếp tục đồng bộ, Codex có thể gửi lại các ngày cũ.",
                "Deletes stored daily usage and quota observations. Cannot be undone. Resuming sync may restore historical days from Codex.",
              )}
            </DialogDescription>
          </DialogHeader>
          <Button
            variant="destructive"
            disabled={busy}
            onClick={() =>
              void action({
                action: "delete_history",
                accountId: erase?.id,
                confirm: true,
              }).then((r) => {
                if (r) setErase(null);
              })
            }
          >
            {text("Xác nhận xóa lịch sử", "Confirm deletion")}
          </Button>
        </DialogContent>
      </Dialog>
    </section>
  );
}
