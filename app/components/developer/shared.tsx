"use client";
import type { ReactNode } from "react";
import { useLanguage } from "@/app/context/language-context";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";
import type { Source } from "@/lib/developer/model";
export function useDeveloperLocale() {
  const { language } = useLanguage();
  return {
    language,
    text: (vi: string, en: string) => (language === "vi" ? vi : en),
    number: (n: number) =>
      new Intl.NumberFormat(language === "vi" ? "vi-VN" : "en-GB", {
        maximumFractionDigits: 1,
        notation: n > 99999 ? "compact" : "standard",
      }).format(n),
  };
}
export function Panel({
  title,
  description,
  children,
  footer,
  className,
}: {
  title: ReactNode;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
}
export function Choice({
  label,
  value,
  onChange,
  items,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  items: { value: string; label: string }[];
}) {
  return (
    <Select
      items={items}
      value={value}
      onValueChange={(v) => {
        if (v !== null) onChange(v);
      }}
    >
      <SelectTrigger aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {items.map((i) => (
            <SelectItem key={i.value} value={i.value}>
              {i.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
export function NoResults() {
  const { text } = useDeveloperLocale();
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>
          {text("Không có dữ liệu phù hợp", "No matching data")}
        </EmptyTitle>
        <EmptyDescription>
          {text(
            "Thử đổi bộ lọc hoặc khoảng thời gian.",
            "Try a different filter or date range.",
          )}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
export function Status({ status }: { status: Source["status"] }) {
  const { text } = useDeveloperLocale();
  const labels = {
    fresh: text("Đã cập nhật", "Updated"),
    stale: text("Đã cũ", "Stale"),
    partial: text("Một phần", "Partial"),
    unavailable: text("Chưa có dữ liệu", "Unavailable"),
  };
  return (
    <Badge
      variant={
        status === "stale"
          ? "destructive"
          : status === "fresh"
            ? "secondary"
            : "outline"
      }
    >
      {labels[status]}
    </Badge>
  );
}
export function downloadText(content: string, name: string) {
  const url = URL.createObjectURL(
    new Blob([content], { type: "text/plain;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
