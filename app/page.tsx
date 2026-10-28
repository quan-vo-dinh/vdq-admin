import { Suspense } from "react";
import { cookies } from "next/headers";
import { publishedPortfolio } from "@/lib/portfolio/public";
import { PortfolioLoading } from "@/components/portfolio/loading";
import { PortfolioRenderer } from "@/components/portfolio/renderer";
export async function generateMetadata() {
  const locale =
    (await cookies()).get("portfolio-locale")?.value === "en" ? "en" : "vi";
  const p = await publishedPortfolio();
  const origin = process.env.APP_ORIGIN;
  if (!origin) throw new Error("APP_ORIGIN required");
  const content = p?.document.locales[locale];
  const avatar=content?.avatarUrl;
  const image=avatar ? `${origin}${avatar.startsWith('media:') ? '/api/portfolio/public/media/'+avatar.slice(6) : '/portfolio-assets/'+avatar.replace(/^\//,'')}` : null;

  return {
    title: content?.name ?? "Portfolio",
    description: content?.copy.metadata.description,
    alternates: { canonical: `${origin}/` },
    openGraph: {
      url: `${origin}/`,
      title: content?.name,
      description: content?.copy.metadata.description,
      locale: locale === "vi" ? "vi_VN" : "en_US",
      images: image ? [{url:image,alt:content?.name}] : [],
    },
    twitter:{card:'summary' as const,title:content?.name,description:content?.copy.metadata.description,images:image?[image]:[]},
    robots: { index: true, follow: true },
  };
}

async function Published() {
  const locale =
    (await cookies()).get("portfolio-locale")?.value === "en" ? "en" : "vi";
  const p = await publishedPortfolio();
  if (!p) return <main className="p-12">Portfolio chưa được xuất bản.</main>;
  return <PortfolioRenderer document={p.document} locale={locale} />;
}
export default function Page() {
  return (
    <Suspense fallback={<PortfolioLoading />}>
      <Published />
    </Suspense>
  );
}
