"use client";

import { useId, useState, type ReactNode, type Ref } from "react";
import Image from "next/image";
import { Check, ChevronDown, Search, ImagePlus, Upload } from "lucide-react";
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
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { iconNames } from "@/lib/portfolio/model";
import { iconRegistry, iconLabels } from "@/components/portfolio/icon-registry";
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
  toolbar,
  footer,
  textareaRef,
  onTextSelection,
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
  toolbar?: ReactNode;
  footer?: ReactNode;
  textareaRef?: Ref<HTMLTextAreaElement>;
  onTextSelection?: (start: number, end: number) => void;
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
      {toolbar}
      {multiline ? (
        <Textarea
          {...props}
          ref={textareaRef}
          rows={rows}
          onSelect={(event) =>
            onTextSelection?.(
              event.currentTarget.selectionStart,
              event.currentTarget.selectionEnd,
            )
          }
        />
      ) : (
        <Input {...props} />
      )}
      {description && (
        <FieldDescription id={!error ? `${id}-help` : undefined}>
          {description}
        </FieldDescription>
      )}
      {error && <FieldError id={`${id}-help`}>{error}</FieldError>}
      {footer}
    </Field>
  );
}

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
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const SelectedIcon = iconRegistry[value as (typeof iconNames)[number]];
  const selectedLabel = iconLabels[value as (typeof iconNames)[number]] ?? value;
  const search = query.trim().toLocaleLowerCase();
  const items = iconNames.filter((name) =>
    `${iconLabels[name]} ${name}`.toLocaleLowerCase().includes(search),
  );
  return (
    <Field>
      <FieldLabel htmlFor={id}>{t("Biểu tượng", "Icon")}</FieldLabel>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setQuery("");
        }}
      >
        <DialogTrigger
          render={
            <Button id={id} variant="outline" disabled={busy}
              className="h-auto min-h-10 w-full justify-between" />
          }
        >
          <span className="flex min-w-0 items-center gap-2">
            {SelectedIcon && <SelectedIcon className="size-6 shrink-0" aria-hidden />}
            <span className="truncate">{selectedLabel}</span>
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </DialogTrigger>
        <DialogContent size="md" closeLabel={t("Đóng", "Close")}>
          <DialogHeader className="pr-8">
            <DialogTitle>{t("Chọn biểu tượng", "Choose an icon")}</DialogTitle>
            <DialogDescription>
              {t("Tìm công nghệ rồi chọn biểu tượng phù hợp.", "Find a technology and select its icon.")}
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              aria-label={t("Tìm biểu tượng", "Search icons")}
              placeholder={t("Tìm công nghệ…", "Search technologies…")}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="pl-9"
            />
          </div>
          <p role="status" className="text-xs text-muted-foreground">{items.length} {t("biểu tượng", "icons")}</p>
          <div className="max-h-[50dvh] overflow-y-auto overscroll-y-contain p-1">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {items.map((name) => {
                const Icon = iconRegistry[name];
                const selected = name === value;
                return (
                  <Button
                    key={name}
                    type="button"
                    variant="outline"
                    disabled={busy}
                    aria-pressed={selected}
                    className={cn(
                      "relative h-auto min-h-24 min-w-0 flex-col gap-2 px-2 py-3 whitespace-normal text-center",
                      selected && "border-primary bg-primary/5 ring-1 ring-primary",
                    )}
                    onClick={() => {
                      onChange(name);
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    <Icon className="size-8 shrink-0" aria-hidden />
                    <span className="text-xs leading-snug">{iconLabels[name]}</span>
                    {selected && <Check className="absolute top-1.5 right-1.5 size-3.5 text-primary" aria-hidden />}
                  </Button>
                );
              })}
            </div>
            {!items.length && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {t("Không tìm thấy biểu tượng. Thử tên công nghệ khác.", "No icons found. Try another technology name.")}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
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
