import { Suspense } from "react";
import { requireOwner } from "@/lib/auth/owner";
import { PortfolioEditor } from "@/components/portfolio/editor";
import { PortfolioEditorLoading } from "@/app/components/portfolio/portfolio-editor";
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
    <Suspense fallback={<PortfolioEditorLoading />}>
      <Editor />
    </Suspense>
  );
}
