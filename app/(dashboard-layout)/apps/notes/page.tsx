import NotesApp from "@/app/components/apps/notes";
import type { Metadata } from "next";
import BreadcrumbComp from "../../layout/shared/breadcrumb/breadcrumb-comp";
import StyleAwareWrapper from "@/app/components/shared/StyleAwareWrapper";
import StyleDivider from "@/app/components/shared/StyleDivider";

export const metadata: Metadata = {
  title: "Notes App",
};

const BCrumb = [
  { to: "/", title: "Home" },
  { title: "Notes" },
];

const Notes = () => {
  return (
    <StyleAwareWrapper
      lyraClassName="flex flex-col p-px gap-px bg-border"
    >
      <div className="bg-background [&_[aria-label=Breadcrumb]]:hidden sm:[&_[aria-label=Breadcrumb]]:flex">
        <BreadcrumbComp title="Notes app" items={BCrumb} />
      </div>
      <StyleDivider />
      <NotesApp />
    </StyleAwareWrapper>
  );
};

export default Notes;
