"use client";
import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ExternalLink, CheckCheck, RotateCcw } from "lucide-react";
import { useDeveloper } from "@/app/context/developer-context";
import type { Notification } from "@/lib/developer/model";
import { FeatureDataTable } from "@/app/components/tables/feature-data-table";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Choice, NoResults, useDeveloperLocale } from "./shared";
import { ProviderTitle } from "./brand-icon";
export function DeveloperInbox() {
  const { data, toggleRead } = useDeveloper();
  const { text } = useDeveloperLocale();
  const [query, setQuery] = useState("");
  const [account, setAccount] = useState("all");
  const [kind, setKind] = useState("all");
  const [status, setStatus] = useState("unread");
  const [selected, setSelected] = useState<Notification | null>(null);
  const rows = data.notifications.filter(
    (n) =>
      (account === "all" || n.sourceId === account) &&
      (kind === "all" || n.kind === kind) &&
      (status === "all" || !n.read) &&
      `${n.title} ${n.repo}`.toLowerCase().includes(query.toLowerCase()),
  );
  const current = data.notifications.find((n) => n.id === selected?.id);
  const kinds = {
    review: text("Review", "Review"),
    mention: text("Được nhắc đến", "Mention"),
    assigned: text("Được giao", "Assigned"),
  };
  const columns: ColumnDef<Notification>[] = [
    {
      accessorKey: "title",
      header: text("Thông báo", "Notification"),
      cell: (c) => (
        <Button
          variant="link"
          className="h-auto whitespace-normal p-0 text-left"
          onClick={() => setSelected(c.row.original)}
        >
          {c.row.original.title}
        </Button>
      ),
    },
    {
      accessorKey: "sourceId",
      header: text("Tài khoản", "Account"),
      cell: (c) => (
        <ProviderTitle provider="GitHub">
          {data.sources
            .find((s) => s.id === c.row.original.sourceId)
            ?.name.replace("GitHub · ", "")}
        </ProviderTitle>
      ),
    },
    { accessorKey: "repo", header: "Repository" },
    {
      accessorKey: "kind",
      header: text("Loại", "Type"),
      cell: (c) => (
        <Badge variant="outline">{kinds[c.row.original.kind]}</Badge>
      ),
    },
    { accessorKey: "date", header: text("Ngày", "Date") },
    {
      id: "read",
      header: text("Thao tác", "Actions"),
      cell: (c) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => toggleRead(c.row.original.id)}
        >
          {c.row.original.read ? (
            <RotateCcw data-icon="inline-start" />
          ) : (
            <CheckCheck data-icon="inline-start" />
          )}
          {c.row.original.read
            ? text("Đánh dấu chưa đọc", "Mark unread")
            : text("Đánh dấu đọc", "Mark read")}
        </Button>
      ),
    },
  ];
  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-end gap-3">
        <Field className="w-full sm:max-w-64">
          <FieldLabel htmlFor="developer-search">
            {text("Tìm thông báo", "Search inbox")}
          </FieldLabel>
          <Input
            id="developer-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="review, chart, next.js…"
          />
        </Field>
        <ToggleGroup
          variant="outline"
          value={[status]}
          onValueChange={(v) => {
            if (v[0]) setStatus(v[0]);
          }}
          aria-label={text("Trạng thái đọc", "Read status")}
        >
          <ToggleGroupItem value="unread">
            {text("Chưa đọc", "Unread")}
          </ToggleGroupItem>
          <ToggleGroupItem value="all">{text("Tất cả", "All")}</ToggleGroupItem>
        </ToggleGroup>
        <Choice
          label={text("Nguồn GitHub", "GitHub source")}
          value={account}
          onChange={setAccount}
          items={[
            { value: "all", label: text("Mọi tài khoản", "All accounts") },
            ...data.sources
              .filter((s) => s.provider === "GitHub")
              .map((s) => ({ value: s.id, label: s.name })),
          ]}
        />
        <Choice
          label={text("Loại thông báo", "Notification type")}
          value={kind}
          onChange={setKind}
          items={[
            { value: "all", label: text("Mọi loại", "All types") },
            ...Object.entries(kinds).map(([value, label]) => ({
              value,
              label,
            })),
          ]}
        />
      </div>
      <div className="[&_[data-slot=table-container]]:h-64 [&_[data-slot=table-container]]:overflow-y-scroll [&_[data-slot=table-container]]:[scrollbar-gutter:stable] [&_thead]:sticky [&_thead]:top-0 [&_thead]:bg-background [&_thead_tr]:h-10 [&_tbody_tr]:h-18">
      <FeatureDataTable
        scrollRows
        data={rows}
        columns={columns}
        empty={<NoResults />}
        label={text("Developer Inbox", "Developer Inbox")}
      />
      </div>
      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selected?.title}</DialogTitle>
            <DialogDescription>
              {selected?.repo} ·{" "}
              {kinds[selected?.kind ?? "review"]}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm">
            {text(
              "Xem danh sách pull request của repository.",
              "View the repository’s pull requests.",
            )}
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (selected) toggleRead(selected.id);
              }}
            >
              {current?.read
                ? text("Đánh dấu chưa đọc", "Mark unread")
                : text("Đánh dấu đã đọc", "Mark read")}
            </Button>
            <Button
              render={
                <a href={selected?.url} target="_blank" rel="noreferrer" />
              }
              nativeButton={false}
            >
              {text("Mở repository", "Open repository")}
              <ExternalLink data-icon="inline-end" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
