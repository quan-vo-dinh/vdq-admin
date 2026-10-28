import { Suspense } from "react";
import { requireOwner } from "@/lib/auth/owner";
import { PortfolioEditor } from "@/components/portfolio/editor";
async function Editor() {
  await requireOwner();
  return <PortfolioEditor />;
}
export const metadata = {
  title: "Portfolio CMS",
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <Suspense fallback={<p>Loading editor…</p>}>
      <Editor />
    </Suspense>
  );
}
