"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Link2,
  Plus,
  Settings2,
  Pause,
  Play,
  Trash2,
  ArrowRight,
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
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import StyleAwareWrapper from "@/app/components/shared/StyleAwareWrapper";
import StyleDivider from "@/app/components/shared/StyleDivider";
import { DashboardCard } from "@/app/components/shared/dashboard-card";
import { PageTitleIcon } from "@/app/components/shared/page-title-icon";
import { HeadingText } from "@/app/components/shared/heading-text";
import { BrandIcon } from "../brand-icon";
import { useDeveloperConnections } from "@/app/context/developer-connections-context";
import {
  connectionCatalog,
  connectionDefinition,
} from "@/lib/developer/connections/catalog";
import type {
  Connection,
  ConnectionKind,
} from "@/lib/developer/connections/types";
import { useConnectionsLocale } from "./locale";
import { ConnectionForm } from "./connection-form";
import { ConnectionDetails } from "./connection-details";
import { ConnectionStatus } from "./connection-status";
export function DeveloperConnections() {
  const { text, copy } = useConnectionsLocale();
  const { connections, save, pause, remove, check } = useDeveloperConnections();
  const [editor, setEditor] = useState<{
    kind: ConnectionKind;
    initial?: Connection;
  } | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [removing, setRemoving] = useState<Connection | null>(null);
  const [notice, setNotice] = useState("");
  const details = connections.find((c) => c.id === detailId);
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <header className="flex flex-col gap-2">
        <h1 className="flex items-center gap-2 text-xl">
          <HeadingText>
            {text("Nguồn dữ liệu & kết nối", "Data sources & connections")}
          </HeadingText>
        <PageTitleIcon /></h1>
        <p className="text-sm text-muted-foreground">
          {text(
            "Chọn đúng phương thức cho từng nguồn. Quyền truy cập và dữ liệu được xác minh riêng.",
            "Choose the right method for each source. Access permissions and data are verified separately.",
          )}
        </p>
      </header>
      <StyleAwareWrapper lyraClassName="developer-board grid grid-cols-12 gap-px bg-border p-px">
        {[
          {
            value: connections.length,
            label: text("Thiết lập đã lưu", "Saved setups"),
          },
          {
            value: connections.filter((c) => !c.paused).length,
            label: text("Đang chờ xác nhận", "Awaiting confirmation"),
          },
          {
            value: connections.filter((c) => c.paused).length,
            label: text("Đã tạm dừng", "Paused"),
          },
        ].map((item) => (
          <div key={item.label} className="col-span-12 sm:col-span-4">
            <DashboardCard>
              <CardHeader>
                <CardDescription>{item.label}</CardDescription>
                <CardTitle>{item.value}</CardTitle>
              </CardHeader>
            </DashboardCard>
          </div>
        ))}
        <StyleDivider wrapperClassName="col-span-12" />
        <div className="col-span-12 bg-background p-4">
          <h2 className="text-lg font-semibold">
            <HeadingText>
              {text("Thiết lập của bạn", "Your setups")}
            </HeadingText>
          </h2>
        </div>
        {!connections.length && (
          <div className="col-span-12 bg-background">
            <Empty>
              <EmptyHeader>
                <EmptyTitle>
                  {text("Chưa có thiết lập nào", "No setups yet")}
                </EmptyTitle>
                <EmptyDescription>
                  {text(
                    "Bắt đầu bằng một nguồn bên dưới. Chỉ những loại dữ liệu được cấp quyền và xác minh mới được theo dõi.",
                    "Start with a source below. Only verified capabilities can provide data.",
                  )}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        )}
        {connections.map((connection, index) => {
          const spec = connectionDefinition(connection.kind);
          return (
            <div
              key={connection.id}
              className={cn(
                "col-span-12",
                !(
                  connections.length % 2 === 1 &&
                  index === connections.length - 1
                ) && "lg:col-span-6",
              )}
            >
              <DashboardCard>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-col gap-2">
                      <CardTitle className="break-words">
                        {connection.name}
                      </CardTitle>
                      <CardDescription>{copy(spec.method)}</CardDescription>
                    </div>
                    <ConnectionStatus connection={connection} />
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <p className="break-all text-sm">{connection.identity}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {connection.group === "personal"
                        ? text("Cá nhân", "Personal")
                        : text("Công việc", "Work")}
                    </Badge>
                    <Badge variant="outline">
                      {connection.capabilities.length}{" "}
                      {text("loại dữ liệu", "data types")}
                    </Badge>
                    {connection.repositories.length > 0 && (
                      <Badge variant="outline">
                        {connection.repositories.length} repositories
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {copy(spec.next)}
                  </p>
                </CardContent>
                <CardFooter className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDetailId(connection.id)}
                  >
                    <Link2 data-icon="inline-start" />
                    {text("Chi tiết", "Details")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setEditor({ kind: connection.kind, initial: connection })
                    }
                  >
                    <Settings2 data-icon="inline-start" />
                    {text("Sửa", "Edit")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => pause(connection.id, !connection.paused)}
                  >
                    {connection.paused ? (
                      <Play data-icon="inline-start" />
                    ) : (
                      <Pause data-icon="inline-start" />
                    )}
                    {connection.paused
                      ? text("Tiếp tục", "Resume")
                      : text("Tạm dừng", "Pause")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`${text("Xóa thiết lập", "Remove setup")} ${connection.name}`}
                    onClick={() => setRemoving(connection)}
                  >
                    <Trash2 />
                  </Button>
                </CardFooter>
              </DashboardCard>
            </div>
          );
        })}
        <StyleDivider wrapperClassName="col-span-12" />
        <div className="col-span-12 bg-background p-4">
          <h2 className="text-lg font-semibold">
            <HeadingText>
              {text("Thêm nguồn dữ liệu", "Add a data source")}
            </HeadingText>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {text(
              "Kết nối repository, theo dõi API hoặc nhận dữ liệu từ công cụ trên máy.",
              "Connect repositories, track APIs, or receive data from tools on a computer.",
            )}
          </p>
        </div>
        {connectionCatalog.map((spec, index) => (
          <div
            key={spec.kind}
            className={cn(
              "col-span-12 md:col-span-6 xl:col-span-4",
              index === connectionCatalog.length - 1 &&
                "md:col-span-12 xl:col-span-4",
            )}
          >
            <DashboardCard>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BrandIcon
                    brand={
                      spec.family === "GitHub"
                        ? "github"
                        : spec.family === "Claude"
                          ? "claude"
                          : spec.kind === "codex"
                            ? "codex"
                            : "chatgpt"
                    }
                  />
                  <CardTitle>{spec.title}</CardTitle>
                </div>
                <CardDescription>{copy(spec.description)}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3">
                <Badge variant="outline" className="whitespace-normal">
                  {copy(spec.method)}
                </Badge>
                <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                  {spec.capabilities.map((cap) => (
                    <li key={cap.id} className="flex items-start gap-2">
                      <ArrowRight className="mt-0.5 size-3.5 shrink-0" />
                      {copy(cap.label)}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  size="sm"
                  aria-label={`${text("Thiết lập", "Set up")} ${spec.title}`}
                  onClick={() => setEditor({ kind: spec.kind })}
                >
                  <Plus data-icon="inline-start" />
                  {text("Thiết lập", "Set up")}
                </Button>
              </CardFooter>
            </DashboardCard>
          </div>
        ))}
      </StyleAwareWrapper>
      <p
        role="status"
        aria-live="polite"
        className="text-sm text-muted-foreground"
      >
        {notice}
      </p>
      {editor && (
        <ConnectionForm
          key={editor.initial?.id ?? editor.kind}
          {...editor}
          onClose={() => setEditor(null)}
          onSave={(input, id) => {
            const saved = save(input, id);
            if (saved)
              setNotice(
                text(
                  "Đã lưu thiết lập. Chờ xác nhận từ nguồn dữ liệu.",
                  "Setup saved. Waiting for confirmation from the data source.",
                ),
              );
            return saved;
          }}
        />
      )}
      {details && (
        <ConnectionDetails
          key={details.id}
          connection={details}
          onClose={() => setDetailId(null)}
          onCheck={() => check(details.id)}
        />
      )}
      <Dialog
        open={!!removing}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
      >
        <DialogContent size="sm" closeLabel={text("Đóng", "Close")}>
          <DialogHeader>
            <DialogTitle>
              {text("Xóa thiết lập này?", "Remove this setup?")}
            </DialogTitle>
            <DialogDescription>
              {removing?.name}.{" "}
              {text(
                "Thao tác này bỏ thiết lập khỏi danh sách, không thu hồi quyền tại nhà cung cấp và không xóa dữ liệu lịch sử.",
                "This removes the setup from this list. It does not revoke provider access or delete historical data.",
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoving(null)}>
              {text("Giữ lại", "Keep setup")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (removing) remove(removing.id);
                setRemoving(null);
                setNotice(text("Đã xóa thiết lập.", "Setup removed."));
              }}
            >
              {text("Xóa thiết lập", "Remove setup")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
