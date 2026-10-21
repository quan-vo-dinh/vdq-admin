"use client";
import { PersonalizedIntro } from "@/app/components/shared/personalized-intro";
import { PageTitleIcon } from "@/app/components/shared/page-title-icon";
import { HeadingText } from "@/app/components/shared/heading-text";
import { Card } from "@/components/ui/card";
import Link from "@/lib/platform/link";
import { useLanguage } from "@/app/context/language-context";

interface BreadcrumbItem {
  to?: string;
  title: string;
}

interface BreadCrumbType {
  subtitle?: string;
  items?: BreadcrumbItem[];
  title: string;
}

const BreadcrumbComp = ({ title }: BreadCrumbType) => {
  const { t } = useLanguage();
  return (
    <>
      <Card
        className={`py-5 px-6 bg-background  overflow-hidden rounded-xl border`}
      >
        <div className="flex items-center justify-between gap-6 relative">
          <div className="flex flex-col gap-1"><h4 className="flex items-center gap-2 font-semibold text-xl text-forground"><HeadingText>{t(title)}</HeadingText><PageTitleIcon /></h4><PersonalizedIntro taglineOnly /></div>
          <ol
            className="flex items-center whitespace-nowrap"
            aria-label="Breadcrumb"
          >
            <li className="flex items-center">
              <Link className="text-forground text-sm  leading-none" href="/">
                {t("Home")}
              </Link>
            </li>
            <li className="mx-2">
              <div className="p-0.5 text-forground">/</div>
            </li>
            <li
              className="flex items-center text-sm text-forground leading-none opacity-80"
              aria-current="page"
            >
              {t(title)}
            </li>
          </ol>
        </div>
      </Card>
    </>
  );
};

export default BreadcrumbComp;
