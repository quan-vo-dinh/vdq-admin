"use client";
import { Children, isValidElement } from "react";
import BlurFade from "@/components/portfolio/magicui/blur-fade";
import { DiaTextReveal } from "@/components/portfolio/ui/dia-text-reveal";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/portfolio/ui/avatar";
import { useSections, usePortfolioData } from "@/components/portfolio/context";
import { useI18n } from "@/components/portfolio/context";
import Link from "next/link";
import { PortfolioText } from "./annotated-text";
import ContactSection from "@/components/portfolio/section/contact-section";
import ProjectsSection from "@/components/portfolio/section/projects-section";
import WorkSection from "@/components/portfolio/section/work-section";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { normalizeImageSrc } from "@/lib/portfolio/ui-utils";
import { ExpandableContent } from "@/components/portfolio/expandable-content";

const BLUR_FADE_DELAY = 0.04;

export default function Content() {
  const { dictionary, locale } = useI18n();
  const data = usePortfolioData();
  const summaryBreak = /\n\s*\n/.exec(data.summary);
  const summaryOffset = summaryBreak
    ? summaryBreak.index + summaryBreak[0].length
    : 0;

  const sections = useSections();
  const content = (
    <>
      <section id="hero">
        <div className="mx-auto w-full max-w-2xl space-y-8">
          <div className="gap-2 gap-y-6 flex flex-col md:flex-row justify-between">
            <div className="gap-2 flex flex-col order-2 md:order-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <BlurFade delay={BLUR_FADE_DELAY}>
                  <h1 className="text-3xl font-semibold tracking-tighter sm:text-4xl lg:text-5xl">
                    <DiaTextReveal
                      text={`${dictionary.home.greeting} ${
                        data.nickname || data.name.split(" ")[0]
                      }`}
                    />
                  </h1>
                </BlurFade>
                <BlurFade delay={BLUR_FADE_DELAY * 1.2}>
                  <span className="text-lg sm:text-xl md:text-2xl text-muted-foreground font-normal">
                    ({data.name})
                  </span>
                </BlurFade>
              </div>
              <BlurFade delay={BLUR_FADE_DELAY}>
                <PortfolioText
                  field="description"
                  className="text-muted-foreground max-w-[600px] md:text-lg lg:text-xl"
                />
              </BlurFade>
            </div>
            <BlurFade delay={BLUR_FADE_DELAY} className="order-1 md:order-2">
              <Avatar className="size-24 md:size-32 border rounded-full shadow-lg ring-4 ring-muted">
                <AvatarImage
                  alt={data.name}
                  src={normalizeImageSrc(data.avatarUrl)}
                />
                <AvatarFallback>{data.initials}</AvatarFallback>
              </Avatar>
            </BlurFade>
          </div>
        </div>
      </section>
      <section id="about">
        <div className="flex min-h-0 flex-col gap-y-4">
          <BlurFade delay={BLUR_FADE_DELAY * 3}>
            <h2 className="text-xl font-bold">{dictionary.home.about}</h2>
          </BlurFade>
          <BlurFade delay={BLUR_FADE_DELAY * 4}>
            <div className="prose max-w-full text-pretty font-sans leading-relaxed text-muted-foreground dark:prose-invert">
              {summaryBreak ? (
                <ExpandableContent
                  key={locale}
                  preview={
                    <PortfolioText
                      field="summary"
                      text={data.summary.slice(0, summaryBreak.index)}
                    />
                  }
                  showMoreLabel={dictionary.home.aboutShowMore}
                  showLessLabel={dictionary.home.aboutShowLess}
                >
                  <PortfolioText
                    field="summary"
                    text={data.summary.slice(summaryOffset)}
                    sourceOffset={summaryOffset}
                  />
                </ExpandableContent>
              ) : (
                <PortfolioText field="summary" />
              )}
            </div>
          </BlurFade>
        </div>
      </section>
      <section id="work">
        <div className="flex min-h-0 flex-col gap-y-6">
          <BlurFade delay={BLUR_FADE_DELAY * 5}>
            <h2 className="text-xl font-bold">{dictionary.home.work}</h2>
          </BlurFade>
          <BlurFade delay={BLUR_FADE_DELAY * 6}>
            <WorkSection />
          </BlurFade>
        </div>
      </section>
      <section id="education">
        <div className="flex min-h-0 flex-col gap-y-6">
          <BlurFade delay={BLUR_FADE_DELAY * 7}>
            <h2 className="text-xl font-bold">{dictionary.home.education}</h2>
          </BlurFade>
          <div className="flex flex-col gap-8">
            {data.education.map((education, index) => (
              <BlurFade
                key={education.id}
                delay={BLUR_FADE_DELAY * 8 + index * 0.05}
              >
                <Link
                  href={education.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-x-3 justify-between group"
                >
                  <div className="flex items-center gap-x-3 flex-1 min-w-0">
                    {education.logoUrl ? (
                      <Image
                        unoptimized
                        src={normalizeImageSrc(education.logoUrl)}
                        alt={education.school}
                        width={40}
                        height={40}
                        className="size-8 md:size-10 p-1 border rounded-full shadow ring-2 ring-border overflow-hidden object-contain flex-none"
                      />
                    ) : (
                      <div className="size-8 md:size-10 p-1 border rounded-full shadow ring-2 ring-border bg-muted flex-none" />
                    )}
                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                      <div className="font-semibold leading-none flex items-center gap-2">
                        {education.school}
                        <ArrowUpRight
                          className="h-3.5 w-3.5 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200"
                          aria-hidden
                        />
                      </div>
                      <div className="font-sans text-sm text-muted-foreground">
                        {education.degree}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs tabular-nums text-muted-foreground text-right flex-none">
                    <span>
                      {education.start} - {education.end}
                    </span>
                  </div>
                </Link>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>
      {data.certifications && data.certifications.length > 0 && (
        <section id="certifications">
          <div className="flex min-h-0 flex-col gap-y-4">
            <BlurFade delay={BLUR_FADE_DELAY * 8.5}>
              <h2 className="text-xl font-bold">
                {dictionary.home.certifications}
              </h2>
            </BlurFade>
            <div className="flex flex-col gap-3">
              {data.certifications.map((cert, id) => (
                <BlurFade key={cert.id} delay={BLUR_FADE_DELAY * 9 + id * 0.05}>
                  <Link
                    href={cert.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-4 group hover:bg-muted/30 p-2 -mx-2 rounded-xl transition-colors cursor-pointer"
                  >
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                        {cert.name}
                        <ArrowUpRight
                          className="h-3.5 w-3.5 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200"
                          aria-hidden
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {cert.issuer}
                      </div>
                    </div>
                    {cert.logoUrl && (
                      <Image
                        unoptimized
                        src={normalizeImageSrc(cert.logoUrl)}
                        alt={cert.issuer}
                        width={40}
                        height={40}
                        className="size-8 md:size-10 p-1.5 border rounded-xl shadow-sm bg-background flex-none object-contain"
                      />
                    )}
                  </Link>
                </BlurFade>
              ))}
            </div>
          </div>
        </section>
      )}
      <section id="skills">
        <div className="flex min-h-0 flex-col gap-y-4">
          <BlurFade delay={BLUR_FADE_DELAY * 9}>
            <h2 className="text-xl font-bold">{dictionary.home.skills}</h2>
          </BlurFade>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill, id) => (
              <BlurFade key={skill.id} delay={BLUR_FADE_DELAY * 10 + id * 0.05}>
                <div className="border bg-background border-border ring-2 ring-border/20 rounded-xl h-8 w-fit px-4 flex items-center gap-2">
                  {skill.icon && (
                    <skill.icon className="size-4 rounded overflow-hidden object-contain" />
                  )}
                  <span className="text-foreground text-sm font-medium">
                    {skill.name}
                  </span>
                </div>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>
      <section id="projects">
        <BlurFade delay={BLUR_FADE_DELAY * 11}>
          <ProjectsSection />
        </BlurFade>
      </section>
      <section id="contact">
        <BlurFade delay={BLUR_FADE_DELAY * 16}>
          <ContactSection />
        </BlurFade>
      </section>
    </>
  );
  const nodes = Children.toArray(content.props.children);
  return (
    <main className="min-h-dvh flex flex-col gap-14 relative">
      {sections
        .filter((s) => s.visible)
        .map((s) =>
          nodes.find(
            (n) => isValidElement<{ id?: string }>(n) && n.props.id === s.id,
          ),
        )}
    </main>
  );
}
