"use client";

import { useCallback, useState, type ReactNode } from "react";
import Image from "next/image";
import Markdown from "react-markdown";
import { Popover } from "@base-ui/react/popover";
import { ArrowUpRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PortfolioAnnotation } from "@/lib/portfolio/model";
import { safeUrl } from "@/lib/portfolio/model";
import { annotationRemark, annotationText } from "@/lib/portfolio/annotations";
import { normalizeImageSrc } from "@/lib/portfolio/ui-utils";
import { usePortfolioText } from "./context";

export function AnnotationCard({
  annotation,
  privateMedia = false,
  children,
}: {
  annotation: PortfolioAnnotation;
  privateMedia?: boolean;
  children: ReactNode;
}) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const attach = useCallback(
    (element: HTMLElement | null) =>
      setContainer(element?.closest<HTMLElement>(".portfolio-surface") ?? null),
    [],
  );
  const image = annotation.image.startsWith("media:")
    ? `/api/portfolio/${privateMedia ? "media" : "public/media"}/${annotation.image.slice(6)}`
    : normalizeImageSrc(annotation.image);
  return (
    <Popover.Root>
      <Popover.Trigger
        ref={attach}
        openOnHover
        delay={180}
        closeDelay={180}
        className={cn(
          "inline cursor-help rounded-sm border-0 p-0 [font:inherit] text-inherit decoration-dotted underline-offset-4 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
          annotation.appearance === "highlight"
            ? "bg-primary/10 px-0.5 underline decoration-primary/40 hover:bg-primary/20"
            : "bg-transparent underline decoration-foreground/50 hover:decoration-foreground",
        )}
      >
        {children}
      </Popover.Trigger>
      <Popover.Portal container={container}>
        <Popover.Positioner
          side="top"
          sideOffset={10}
          collisionPadding={12}
          className="isolate z-50"
        >
          <Popover.Popup className="w-80 max-w-[calc(100vw-1.5rem)] origin-(--transform-origin) max-h-(--available-height) overflow-y-auto rounded-xl border bg-popover text-popover-foreground shadow-xl outline-none motion-safe:duration-200 motion-safe:data-open:animate-in motion-safe:data-open:fade-in-0 motion-safe:data-open:zoom-in-95 motion-safe:data-closed:animate-out motion-safe:data-closed:fade-out-0">
            {annotation.image && (
              <div className="relative aspect-video border-b bg-muted">
                <Image
                  src={image}
                  alt=""
                  fill
                  sizes="320px"
                  unoptimized
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex max-h-80 flex-col gap-2 overflow-y-auto p-4">
              <div className="flex items-start justify-between gap-3">
                <Popover.Title className="font-semibold leading-snug">
                  {annotation.title || annotation.quote}
                </Popover.Title>
                <Popover.Close
                  aria-label="Close / Đóng"
                  className="shrink-0 rounded-sm text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <X className="size-4" />
                </Popover.Close>
              </div>
              {annotation.body && (
                <Popover.Description className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {annotation.body}
                </Popover.Description>
              )}
              {annotation.href && safeUrl(annotation.href) && (
                <a
                  href={annotation.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 self-start text-sm font-medium underline underline-offset-4"
                >
                  {annotation.title || annotation.quote}
                  <ArrowUpRight className="size-3.5" aria-hidden />
                </a>
              )}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
export function AnnotatedMarkdown({
  text,
  annotations = [],
  privateMedia = false,
  source = text,
  sourceOffset = 0,
  inline = false,
  className,
}: {
  text: string;
  annotations?: readonly PortfolioAnnotation[];
  privateMedia?: boolean;
  source?: string;
  sourceOffset?: number;
  inline?: boolean;
  className?: string;
}) {
  const Wrapper = inline ? "span" : "div";
  return (
    <Wrapper
      className={cn(
        "[&_p+p]:mt-3 [&_strong]:font-semibold [&_em]:italic [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:pl-3",
        className,
      )}
    >
      <Markdown
        skipHtml
        urlTransform={(url) => (safeUrl(url) ? url : "")}
        remarkPlugins={[annotationRemark(source, annotations, sourceOffset)]}
        allowedElements={
          inline
            ? ["p", "strong", "em", "a", "del", "code", "br", "mark"]
            : undefined
        }
        unwrapDisallowed
        components={{
          img: () => null,
          ...(inline ? { p: ({ children }) => <span>{children}</span> } : {}),
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          mark: ({ node, children }) => {
            const id = String(
              node?.properties?.["data-portfolio-annotation"] ??
                node?.properties?.dataPortfolioAnnotation ??
                "",
            );
            const annotation = annotations.find(
              (a) => a.id === id && a.enabled,
            );
            return annotation ? (
              <AnnotationCard
                annotation={annotation}
                privateMedia={privateMedia}
              >
                {children}
              </AnnotationCard>
            ) : (
              <>{children}</>
            );
          },
        }}
      >
        {text}
      </Markdown>
    </Wrapper>
  );
}
export function PortfolioText({
  field,
  itemId = "",
  text,
  sourceOffset = 0,
  inline = false,
  className,
}: {
  field: PortfolioAnnotation["field"];
  itemId?: string;
  text?: string;
  sourceOffset?: number;
  inline?: boolean;
  className?: string;
}) {
  const { resume, preview } = usePortfolioText();
  const source = annotationText(resume, field, itemId);
  return (
    <AnnotatedMarkdown
      text={text ?? source}
      source={source}
      sourceOffset={sourceOffset}
      annotations={resume.annotations?.filter(
        (a) => a.field === field && a.itemId === itemId,
      )}
      privateMedia={preview}
      inline={inline}
      className={className}
    />
  );
}
