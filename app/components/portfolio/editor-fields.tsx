"use client";

import { useId, useState } from "react";
import Image from "next/image";
import { Check, ImagePlus, Upload } from "lucide-react";
import { usePortfolioEditor } from "@/app/context/portfolio-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { iconNames } from "@/lib/portfolio/model";
import { iconRegistry } from "@/components/portfolio/icon-registry";
import { cn } from "@/lib/utils";

export function useEditorCopy() {
  const { language } = usePortfolioEditor();
  return (vi: string, en: string) => (language === "vi" ? vi : en);
}

export function TextField({
  label,
  value,
  onChange,
  description,
  multiline,
  path,
  placeholder,
  rows = 4,
  error: explicitError,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
  multiline?: boolean;
  path?: string;
  placeholder?: string;
  rows?: number;
  error?: string;
  className?: string;
}) {
  const id = useId();
  const { fieldErrors, busy } = usePortfolioEditor();
  const error = explicitError ?? (path ? fieldErrors[path] : undefined);
  const props = {
    id,
    value,
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => onChange(event.target.value),
    placeholder,
    disabled: busy,
    "aria-invalid": !!error,
    "aria-describedby": description || error ? `${id}-help` : undefined,
  };
  return (
    <Field data-invalid={!!error} className={className}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {multiline ? <Textarea {...props} rows={rows} /> : <Input {...props} />}
      {description && (
        <FieldDescription id={!error ? `${id}-help` : undefined}>
          {description}
        </FieldDescription>
      )}
      {error && <FieldError id={`${id}-help`}>{error}</FieldError>}
    </Field>
  );
}

const iconLabels: Record<string, string> = {
  Typescript: "TypeScript",
  ReactLight: "React",
  NextjsIconDark: "Next.js",
  "Icons.tailwindcss": "Tailwind CSS",
  antdesign: "Ant Design",
  reactquery: "TanStack Query",
  nestjs: "NestJS",
  socketdotio: "WebSocket",
  redis: "Redis",
  apachekafka: "Apache Kafka",
  keycloak: "Keycloak",
  mongodb: "MongoDB",
  Postgresql: "PostgreSQL",
  Docker: "Docker",
  HomeIcon: "Website",
  CameraIcon: "Camera",
  FolderKanbanIcon: "Project",
  BookOpenIcon: "Article",
  "Icons.github": "GitHub",
  "Icons.linkedin": "LinkedIn",
  "Icons.facebook": "Facebook",
  "Icons.instagram": "Instagram",
  "Icons.x": "X",
  "Icons.youtube": "YouTube",
  "Icons.email": "Email",
};
export function IconField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId(),
    t = useEditorCopy();
  const { busy } = usePortfolioEditor();
  const SelectedIcon = iconRegistry[value as (typeof iconNames)[number]];
  const items = iconNames.map((value) => ({
    value,
    label: iconLabels[value] ?? value,
  }));
  return (
    <Field>
      <FieldLabel htmlFor={id}>{t("Biểu tượng", "Icon")}</FieldLabel>
      <Select
        items={items}
        value={value}
        disabled={busy}
        onValueChange={(value) => value && onChange(value)}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue>
            <span className="flex items-center gap-2">
              {SelectedIcon && <SelectedIcon aria-hidden />}
              {iconLabels[value] ?? value}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {items.map((item) => {
              const Icon = iconRegistry[item.value];
              return (
                <SelectItem key={item.value} value={item.value}>
                  <Icon aria-hidden />
                  {item.label}
                </SelectItem>
              );
            })}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  );
}

export const sourceAssets = [
  ["/me.jpg", "Ảnh chân dung", "Portrait"],
  ["/iSOFT_LOGO-nobackground.png", "i-Soft", "i-Soft"],
  ["/wm.png", "WM Media", "WM Media"],
  ["/geekup.jpg", "GEEK Up", "GEEK Up"],
  ["/uit.png", "Đại học UIT", "UIT"],
  ["/qrtable.webp", "QRTable", "QRTable"],
  ["/multi-vendor.webp", "Multi Vendor API", "Multi Vendor API"],
  ["/kick.webp", "Kicks Shoes", "Kicks Shoes"],
  ["/car-garage.webp", "Car Garage", "Car Garage"],
  ["/meta.png", "Meta", "Meta"],
  ["/ibm.png", "IBM", "IBM"],
] as const;
export function assetUrl(value: string) {
  return value.startsWith("media:")
    ? `/api/portfolio/media/${value.slice(6)}`
    : `/portfolio-assets/${value.replace(/^\//, "")}`;
}
export function AssetThumbnail({
  value,
  label,
  large = false,
  variant = "thumbnail",
}: {
  value: string;
  label: string;
  large?: boolean;
  variant?: "thumbnail" | "portrait" | "cover";
}) {
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-lg border bg-muted/30",
        large || variant === "cover" ? "aspect-video w-full" : "size-12",
        variant === "cover" && "rounded-b-none",
        variant === "portrait" && "aspect-square size-auto w-full max-w-80",
      )}
    >
      {value ? (
        <Image
          src={assetUrl(value)}
          alt={label}
          fill
          sizes={
            variant === "portrait"
              ? "320px"
              : large || variant === "cover"
                ? "(max-width: 640px) 100vw, 50vw"
                : "48px"
          }
          unoptimized
          className={cn(
            "object-contain",
            variant === "thumbnail" && "p-2",
            variant !== "thumbnail" && "object-cover",
          )}
        />
      ) : (
        <div className="flex h-full items-center justify-center">
          <ImagePlus className="size-5 text-muted-foreground" aria-hidden />
        </div>
      )}
    </div>
  );
}

export function ImageField({
  value,
  onChange,
  label,
  variant = "thumbnail",
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  variant?: "thumbnail" | "portrait" | "cover";
}) {
  const [open, setOpen] = useState(false),
    t = useEditorCopy();
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <div
        className={cn(
          "flex gap-4",
          variant === "thumbnail" ? "items-center" : "flex-col",
        )}
      >
        <AssetThumbnail value={value} label={label} variant={variant} />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(true)}
          >
            <ImagePlus data-icon="inline-start" />
            {t("Chọn ảnh", "Choose image")}
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange("")}
            >
              {t("Gỡ ảnh", "Remove")}
            </Button>
          )}
        </div>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>{t("Chọn ảnh", "Choose image")}</DialogTitle>
            <DialogDescription>
              {t(
                "Chọn từ thư viện hoặc tải ảnh mới lên.",
                "Choose from the library or upload a new image.",
              )}
            </DialogDescription>
          </DialogHeader>
          <MediaLibrary
            selected={value}
            onSelect={(value) => {
              onChange(value);
              setOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </Field>
  );
}

export function MediaLibrary({
  selected,
  onSelect,
}: {
  selected?: string;
  onSelect?: (value: string) => void;
}) {
  const { media, upload, busy, mediaError, retry } = usePortfolioEditor();
  const t = useEditorCopy(),
    id = useId();
  const options = [
    ...media.map((m, index) => ({
      value: `media:${m.id}`,
      label: `${t("Ảnh tải lên", "Upload")} ${index + 1}`,
    })),
    ...sourceAssets.map(([value, vi, en]) => ({ value, label: t(vi, en) })),
  ];
  return (
    <div className="flex flex-col gap-5">
      <Field>
        <FieldLabel htmlFor={id} className="flex items-center gap-2">
          <Upload className="size-4" />
          {t("Tải ảnh lên", "Upload image")}
        </FieldLabel>
        <Input
          id={id}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={busy}
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const result = await upload(file);
            if (result && onSelect) onSelect(`media:${result.id}`);
            event.target.value = "";
          }}
        />
        <FieldDescription>
          {t(
            "PNG, JPG hoặc WebP · Tối đa 2 MB. Ảnh mới chỉ công khai sau khi xuất bản.",
            "PNG, JPG or WebP · Up to 2 MB. New images stay private until published.",
          )}
        </FieldDescription>
      </Field>
      {mediaError && (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>
              {t("Không tải được ảnh đã lưu", "Saved images unavailable")}
            </EmptyTitle>
            <EmptyDescription>
              {t(
                "Ảnh gốc vẫn có sẵn. Thử tải lại thư viện.",
                "Original assets are available. Retry the media library.",
              )}
            </EmptyDescription>
          </EmptyHeader>
          <Button variant="outline" onClick={() => void retry()}>
            {t("Thử lại", "Retry")}
          </Button>
        </Empty>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {options.map((option) => (
          <div key={option.value} className="flex min-w-0 flex-col gap-2">
            {onSelect ? (
              <Button
                type="button"
                variant="outline"
                className="h-auto w-full flex-col gap-2 p-2"
                onClick={() => onSelect(option.value)}
                aria-pressed={selected === option.value}
              >
                <AssetThumbnail
                  value={option.value}
                  label={option.label}
                  large
                />
                <span className="flex max-w-full items-center gap-1 truncate">
                  {selected === option.value && (
                    <Check data-icon="inline-start" />
                  )}
                  {option.label}
                </span>
              </Button>
            ) : (
              <>
                <AssetThumbnail
                  value={option.value}
                  label={option.label}
                  large
                />
                <p className="truncate text-sm">{option.label}</p>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
