import { Suspense } from "react";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { draftPortfolio } from "@/lib/portfolio/server";
import { PortfolioRenderer } from "@/components/portfolio/renderer";
export const metadata = {
  title: "Portfolio draft preview",
  robots: { index: false, follow: false },
};
async function Preview() {
  // Do not initialize owner Auth/session timers while prerendering a private preview.
  await connection();
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
