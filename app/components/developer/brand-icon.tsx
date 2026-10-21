import Image from "@/lib/platform/image";
import { cn } from "@/lib/utils";
import type { Provider } from "@/lib/developer/model";
type Brand = "claude" | "codex" | "chatgpt" | "github";
const labels: Record<Brand, string> = {
  claude: "Claude",
  codex: "Codex",
  chatgpt: "ChatGPT / OpenAI",
  github: "GitHub",
};
// Local SVGs from Lobe Icons 6.0.0 (MIT). No runtime icon CDN requests.
export function BrandIcon({
  brand,
  className,
}: {
  brand: Brand;
  className?: string;
}) {
  return (
    <Image
      src={`/images/brands/${brand}.svg`}
      alt={labels[brand]}
      width={24}
      height={24}
      unoptimized
      className={cn("size-6 shrink-0", className)}
    />
  );
}
export function ProviderTitle({
  provider,
  children,
}: {
  provider: Provider;
  children: React.ReactNode;
}) {
  return (
    <span className="flex items-center gap-2">
      <BrandIcon
        brand={
          provider === "Codex"
            ? "codex"
            : provider === "GitHub"
              ? "github"
              : "claude"
        }
      />
      {children}
    </span>
  );
}
