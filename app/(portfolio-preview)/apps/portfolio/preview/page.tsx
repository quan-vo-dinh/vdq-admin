import { Suspense } from "react";
import { cookies } from "next/headers";
import { draftPortfolio } from "@/lib/portfolio/server";
import { PortfolioRenderer } from "@/components/portfolio/renderer";
export const metadata = {
  title: "Portfolio draft preview",
  robots: { index: false, follow: false },
};
async function Preview() {
  const site = await draftPortfolio();
  const locale =
    (await cookies()).get("portfolio-locale")?.value === "en" ? "en" : "vi";
  if (!site) return <p>Save a draft first.</p>;
  return (
    <>
      <p className="p-2 text-center">
        Private draft · revision {site.revision}
      </p>
      <PortfolioRenderer document={site.draft} locale={locale} preview />
    </>
  );
}
export default function Page() {
  return (
    <Suspense fallback={<p>Loading private preview…</p>}>
      <Preview />
    </Suspense>
  );
}
