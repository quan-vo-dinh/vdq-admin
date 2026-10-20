"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  FieldGroup,
  Field,
  FieldLabel,
  FieldDescription,
  FieldSet,
  FieldLegend,
  FieldError,
} from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useConnectionsLocale } from "./locale";
import { connectionDefinition } from "@/lib/developer/connections/catalog";
import {
  validateConnection,
  requestedPermissions,
} from "@/lib/developer/connections/model";
import type {
  Connection,
  ConnectionInput,
  ConnectionKind,
} from "@/lib/developer/connections/types";
export function ConnectionForm({
  kind,
  initial,
  onClose,
  onSave,
}: {
  kind: ConnectionKind;
  initial?: Connection;
  onClose: () => void;
  onSave: (value: ConnectionInput, id?: string) => boolean;
}) {
  const { text, copy } = useConnectionsLocale();
  const spec = connectionDefinition(kind);
  const [name, setName] = useState(initial?.name ?? spec.title);
  const [identity, setIdentity] = useState(initial?.identity ?? "");
  const [group, setGroup] = useState<"personal" | "work">(
    initial?.group ?? "personal",
  );
  const [repositories, setRepositories] = useState(
    initial?.repositories.join("\n") ?? "",
  );
  const [endpoint, setEndpoint] = useState(
    initial?.endpoint ?? "http://localhost:4318",
  );
  const [capabilities, setCapabilities] = useState(
    initial?.capabilities ?? spec.capabilities.map((c) => c.id),
  );
  const [error, setError] =
    useState<ReturnType<typeof validateConnection>>(null);
  const messages = {
    name: text("Nhập tên từ 1–80 ký tự.", "Enter a name of 1–80 characters."),
    identity: text(
      "Nhập định danh từ 1–160 ký tự.",
      "Enter an identifier of 1–160 characters.",
    ),
    repositories: text(
      "Nhập 1–50 repository dạng owner/repo, mỗi dòng một repository.",
      "Enter 1–50 repositories as owner/repo, one per line.",
    ),
    endpoint: text(
      "Dùng URL HTTPS hoặc HTTP trên localhost, không chứa credential, query hay fragment.",
      "Use HTTPS or localhost HTTP without credentials, query or fragment.",
    ),
    capabilities: text(
      "Chọn ít nhất một loại dữ liệu.",
      "Select at least one data type.",
    ),
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="max-h-[85dvh] overflow-y-auto sm:max-w-xl"
        closeLabel={text("Đóng", "Close")}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const input: ConnectionInput = {
              kind,
              name,
              identity,
              group,
              repositories:
                kind === "github-repo"
                  ? repositories
                      .split(/[\n,]+/)
                      .map((r) => r.trim())
                      .filter(Boolean)
                  : [],
              endpoint: kind === "claude-telemetry" ? endpoint : "",
              capabilities,
            };
            const problem = validateConnection(input);
            setError(problem);
            if (!problem && onSave(input, initial?.id)) onClose();
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {initial
                ? text("Sửa thiết lập", "Edit setup")
                : text("Thiết lập nguồn dữ liệu", "Set up a data source")}
            </DialogTitle>
            <DialogDescription>
              {spec.title} · {copy(spec.method)}
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="my-6">
            <Field data-invalid={error === "name" || undefined}>
              <FieldLabel htmlFor="connection-name">
                {text("Tên hiển thị", "Display name")}
              </FieldLabel>
              <Input
                id="connection-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                required
                aria-invalid={error === "name"}
              />
              {error === "name" && <FieldError>{messages.name}</FieldError>}
            </Field>
            <Field>
              <FieldLabel>{text("Nhóm", "Group")}</FieldLabel>
              <ToggleGroup
                variant="outline"
                value={[group]}
                onValueChange={(values) => {
                  if (values[0])
                    setGroup(values[0] === "work" ? "work" : "personal");
                }}
                aria-label={text("Nhóm tài khoản", "Account group")}
              >
                <ToggleGroupItem value="personal">
                  {text("Cá nhân", "Personal")}
                </ToggleGroupItem>
                <ToggleGroupItem value="work">
                  {text("Công việc", "Work")}
                </ToggleGroupItem>
              </ToggleGroup>
              <FieldDescription>
                {text(
                  "Nhãn phân nhóm không thay đổi quyền truy cập.",
                  "Grouping does not change access permissions.",
                )}
              </FieldDescription>
            </Field>
            <Field data-invalid={error === "identity" || undefined}>
              <FieldLabel htmlFor="connection-identity">
                {copy(spec.identityLabel)}
              </FieldLabel>
              <Input
                id="connection-identity"
                value={identity}
                onChange={(e) => setIdentity(e.target.value)}
                maxLength={160}
                required
                aria-invalid={error === "identity"}
              />
              <FieldDescription>{copy(spec.identityHint)}</FieldDescription>
              {error === "identity" && (
                <FieldError>{messages.identity}</FieldError>
              )}
            </Field>
            {kind === "github-repo" && (
              <Field data-invalid={error === "repositories" || undefined}>
                <FieldLabel htmlFor="connection-repos">
                  {text("Repository muốn theo dõi", "Repositories to track")}
                </FieldLabel>
                <Textarea
                  id="connection-repos"
                  value={repositories}
                  onChange={(e) => setRepositories(e.target.value)}
                  required
                  maxLength={5000}
                  placeholder="owner/repository"
                  aria-invalid={error === "repositories"}
                />
                <FieldDescription>
                  {text(
                    "Mỗi dòng một owner/repo. Danh sách này cần được GitHub xác nhận quyền truy cập.",
                    "One owner/repo per line. GitHub must confirm access to this list.",
                  )}
                </FieldDescription>
                {error === "repositories" && (
                  <FieldError>{messages.repositories}</FieldError>
                )}
              </Field>
            )}
            {kind === "claude-telemetry" && (
              <Field data-invalid={error === "endpoint" || undefined}>
                <FieldLabel htmlFor="connection-endpoint">
                  {text("Địa chỉ collector", "Collector endpoint")}
                </FieldLabel>
                <Input
                  id="connection-endpoint"
                  type="url"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  required
                  aria-invalid={error === "endpoint"}
                />
                <FieldDescription>
                  {text(
                    "Máy gửi telemetry phải truy cập được địa chỉ này. localhost là chính máy gửi.",
                    "The exporting computer must reach this address. localhost refers to that computer.",
                  )}
                </FieldDescription>
                {error === "endpoint" && (
                  <FieldError>{messages.endpoint}</FieldError>
                )}
              </Field>
            )}
            <FieldSet>
              <FieldLegend>
                {text("Dữ liệu muốn theo dõi", "Data to track")}
              </FieldLegend>
              <FieldGroup>
                {spec.capabilities.map((cap) => (
                  <Field orientation="horizontal" key={cap.id}>
                    <Checkbox
                      id={`cap-${cap.id}`}
                      checked={capabilities.includes(cap.id)}
                      onCheckedChange={(checked) =>
                        setCapabilities((current) =>
                          checked
                            ? [...current, cap.id]
                            : current.filter((id) => id !== cap.id),
                        )
                      }
                    />
                    <FieldLabel htmlFor={`cap-${cap.id}`}>
                      {copy(cap.label)}
                    </FieldLabel>
                  </Field>
                ))}
              </FieldGroup>
              {error === "capabilities" && (
                <FieldError>{messages.capabilities}</FieldError>
              )}
            </FieldSet>
            <FieldSet>
              <FieldLegend>
                {text(
                  "Quyền / phạm vi cần xác minh",
                  "Permissions / scope to verify",
                )}
              </FieldLegend>
              <div className="flex flex-wrap gap-2">
                {requestedPermissions({ kind, capabilities }).map(
                  (permission) => (
                    <Badge key={permission} variant="outline">
                      {permission}
                    </Badge>
                  ),
                )}
              </div>
            </FieldSet>
            <Alert>
              <AlertTitle>{text("Sau khi lưu", "After saving")}</AlertTitle>
              <AlertDescription>{copy(spec.next)}</AlertDescription>
            </Alert>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {text("Hủy", "Cancel")}
            </Button>
            <Button type="submit">{text("Lưu thiết lập", "Save setup")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
