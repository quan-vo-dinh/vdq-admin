import type { PortfolioDocument, Resume } from "./model.ts";

export function fingerprint(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(fingerprint).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${fingerprint(v)}`)
      .join(",")}}`;
  return JSON.stringify(value) ?? "null";
}
export function mirrorResume(
  document: PortfolioDocument,
  locale: "vi" | "en",
  resume: Resume,
): PortfolioDocument {
  const next = structuredClone(document),
    other = locale === "vi" ? "en" : "vi";
  next.locales[locale] = structuredClone(resume);
  // Copy only new IDs into the other locale; existing translations are never replaced.
  function mirror<T extends { id: string }>(items: T[], opposite: T[]): T[] {
    return items.map(
      (item) => opposite.find((x) => x.id === item.id) ?? structuredClone(item),
    );
  }
  const source = next.locales[locale],
    target = next.locales[other];
  target.work = mirror(source.work, target.work);
  target.education = mirror(source.education, target.education);
  target.projects = mirror(source.projects, target.projects);
  target.certifications = mirror(source.certifications, target.certifications);
  target.skills = mirror(source.skills, target.skills);
  target.navbar = mirror(source.navbar, target.navbar);
  target.contact.social = mirror(source.contact.social, target.contact.social);
  return next;
}

/** Compare content, never publication revision: restoring can retain a different draft at the same revision. */
export function hasUnpublishedChanges(
  document: PortfolioDocument | null,
  publishedId: string | null | undefined,
  publishedDocument?: PortfolioDocument | null,
): boolean {
  return (
    !!document &&
    (!publishedId ||
      !publishedDocument ||
      fingerprint(document) !== fingerprint(publishedDocument))
  );
}
