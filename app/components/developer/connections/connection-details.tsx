"use client";
import { useState } from "react";
import { Copy, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { connectionDefinition } from "@/lib/developer/connections/catalog";
import { telemetryConfig } from "@/lib/developer/connections/model";
import type { Connection } from "@/lib/developer/connections/types";
import { useConnectionsLocale } from "./locale";
import { ConnectionStatus } from "./connection-status";
export function ConnectionDetails({
  connection,
  onClose,
  onCheck,
}: {
  connection: Connection;
  onClose: () => void;
  onCheck: () => void;
}) {
  const { text, copy, language } = useConnectionsLocale();
  const spec = connectionDefinition(connection.kind);
  const [message, setMessage] = useState("");
  const date = (value: string) =>
    new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-GB", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "Asia/Ho_Chi_Minh",
    }).format(new Date(value));
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent size="lg"
        className="max-h-[85dvh] overflow-y-auto "
        closeLabel={text("Đóng", "Close")}
      >
        <DialogHeader>
          <DialogTitle>{connection.name}</DialogTitle>
          <DialogDescription>
            {spec.title} · {connection.identity}
          </DialogDescription>
        </DialogHeader>
        <ConnectionStatus connection={connection} />
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-sm">
          <dt className="text-muted-foreground">
            {text("Phương thức", "Method")}
          </dt>
          <dd>{copy(spec.method)}</dd>
          <dt className="text-muted-foreground">{text("Nhóm", "Group")}</dt>
          <dd>
            {connection.group === "work"
              ? text("Công việc", "Work")
              : text("Cá nhân", "Personal")}
          </dd>
          <dt className="text-muted-foreground">{text("Đã tạo", "Created")}</dt>
          <dd>{date(connection.createdAt)}</dd>
          <dt className="text-muted-foreground">
            {text("Đồng bộ thành công", "Successful sync")}
          </dt>
          <dd>—</dd>
        </dl>
        {connection.repositories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {connection.repositories.map((repo) => (
              <Badge variant="outline" key={repo}>
                {repo}
              </Badge>
            ))}
          </div>
        )}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium">
            {text("Khả năng truy cập dữ liệu", "Data capabilities")}
          </h3>
          {spec.capabilities
            .filter((cap) => connection.capabilities.includes(cap.id))
            .map((cap) => (
              <div
                key={cap.id}
                className="flex flex-wrap items-center justify-between gap-2 text-sm"
              >
                <span>{copy(cap.label)}</span>
                <Badge variant="outline">
                  {text("Chưa xác minh", "Unverified")}
                </Badge>
              </div>
            ))}
        </div>
        <Alert>
          <AlertTitle>{text("Bước tiếp theo", "Next step")}</AlertTitle>
          <AlertDescription>{copy(spec.next)}</AlertDescription>
        </Alert>
        {connection.kind === "claude-telemetry" && (
          <div className="flex flex-col gap-3">
            <p className="break-all text-sm text-muted-foreground">
              {connection.endpoint}
            </p>
            <pre className="max-w-full overflow-x-auto rounded-lg bg-muted p-3 text-xs">
              {telemetryConfig(connection.endpoint)}
            </pre>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    telemetryConfig(connection.endpoint),
                  );
                  setMessage(
                    text(
                      "Đã sao chép cấu hình. Chờ dữ liệu từ máy gửi.",
                      "Configuration copied. Waiting for data from the exporting computer.",
                    ),
                  );
                } catch {
                  setMessage(
                    text(
                      "Không sao chép được. Chọn và sao chép nội dung phía trên.",
                      "Could not copy. Select and copy the configuration above.",
                    ),
                  );
                }
              }}
            >
              <Copy data-icon="inline-start" />
              {text("Sao chép cấu hình", "Copy configuration")}
            </Button>
          </div>
        )}
        {connection.checkedAt && (
          <Alert>
            <AlertTitle>
              {text("Chưa có xác nhận kết nối", "Connection not confirmed")}
            </AlertTitle>
            <AlertDescription>
              {text(
                "Thiết lập hợp lệ. Chưa nhận kết quả xác minh từ dịch vụ hoặc dữ liệu từ máy gửi.",
                "Setup is valid. No verification result from the service or data from the exporting computer has been received.",
              )}{" "}
              <span>{date(connection.checkedAt)}</span>
            </AlertDescription>
          </Alert>
        )}
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
        <DialogFooter>
          <Button
            variant="outline"
            render={<a href={spec.docs} target="_blank" rel="noreferrer" />}
            nativeButton={false}
          >
            <ExternalLink data-icon="inline-start" />
            {text("Hướng dẫn thiết lập", "Setup guide")}
          </Button>
          <Button onClick={onCheck} disabled={connection.paused}>
            <RefreshCw data-icon="inline-start" />
            {text("Kiểm tra trạng thái", "Check status")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
