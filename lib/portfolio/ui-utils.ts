export { cn } from "@/lib/utils";
export function normalizeImageSrc(src: string) {
  return src.startsWith("/api/portfolio/")
    ? src
    : `/portfolio-assets/${src.replace(/^\//, "")}`;
}
