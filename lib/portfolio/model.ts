import { z } from "zod";
export const iconNames = [
  "Typescript",
  "ReactLight",
  "NextjsIconDark",
  "Icons.tailwindcss",
  "Docker",
  "antdesign",
  "reactquery",
  "nestjs",
  "socketdotio",
  "redis",
  "apachekafka",
  "keycloak",
  "mongodb",
  "Postgresql",
  "HomeIcon",
  "CameraIcon",
  "FolderKanbanIcon",
  "BookOpenIcon",
  "Icons.github",
  "Icons.linkedin",
  "Icons.facebook",
  "Icons.instagram",
  "Icons.x",
  "Icons.youtube",
  "Icons.email",
] as const;
export const sectionNames = [
  "hero",
  "about",
  "work",
  "education",
  "certifications",
  "skills",
  "projects",
  "contact",
] as const;
export const id = z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/);
const text = z
  .string()
  .max(10000)
  .refine(
    (s) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(s),
    "Unsupported control character",
  );
export function safeUrl(s: string) {
  if (s === "" || s === "#") return true;
  if (/[\s\\\u0000-\u001f]/.test(s)) return false;
  return (
    /^\/(?!\/)[a-zA-Z0-9/_?=.&%-]*$/.test(s) ||
    /^https:\/\/[a-zA-Z0-9][a-zA-Z0-9.-]*(?:[/?#][^\s\\]*)?$/.test(s) ||
    /^(mailto|tel):[^\s\\]+$/.test(s)
  );
}

const url = z
  .string()
  .max(2000)
  .refine(safeUrl, "Use a safe HTTPS, mailto, tel or local URL");
const assets = [
  "me.jpg",
  "iSOFT_LOGO-nobackground.png",
  "wm.png",
  "geekup.jpg",
  "uit.png",
  "qrtable.webp",
  "multi-vendor.webp",
  "kick.webp",
  "car-garage.webp",
  "meta.png",
  "ibm.png",
];
const image = z
  .string()
  .refine(
    (s) =>
      s === "" ||
      assets.includes(s.replace(/^\//, "")) ||
      /^media:[0-9a-f-]{36}$/.test(s),
    "Select a portfolio asset",
  );
const icon = z.enum(iconNames);
const list = <T extends z.ZodType>(schema: T) =>
  z
    .array(schema)
    .max(100)
    .refine(
      (a) => new Set(a.map((x) => (x as { id: string }).id)).size === a.length,
      "Duplicate IDs",
    );
const link = z.strictObject({ id, type: text, href: url, icon });
const work = z.strictObject({
  id,
  company: text,
  companyContext: text.optional(),
  href: url,
  badges: z.array(text).max(20),
  location: text,
  title: text,
  logoUrl: image,
  logoClassName: z.enum(["bg-[#0B67B2] p-0.5", ""]).optional(),
  start: text,
  end: text.optional(),
  description: text,
});
const education = z.strictObject({
  id,
  school: text,
  href: url,
  degree: text,
  logoUrl: image,
  start: text,
  end: text,
});
const certification = z.strictObject({
  id,
  name: text,
  issuer: text,
  href: url,
  logoUrl: image,
});
const project = z.strictObject({
  id,
  title: text,
  href: url,
  dates: text,
  active: z.boolean(),
  description: text,
  technologies: z.array(z.string().max(120)).max(50),
  links: list(link),
  image,
  video: z.literal(""),
});
const copyMap = z.record(z.string().regex(/^[a-zA-Z]+$/), z.string().max(2000));
export const annotationFields = [
  "description",
  "summary",
  "work.description",
  "projects.description",
  "copy.home.projectsDescription",
  "copy.home.contactBeforeLink",
  "copy.home.contactAfterLink",
] as const;
export const annotationSchema = z
  .strictObject({
    id,
    field: z.enum(annotationFields),
    itemId: z.union([z.literal(""), id]),
    quote: text.min(1).max(500).refine(value=>value.length<=500,"Quote is too long"),
    occurrence: z.number().int().min(1).max(1000),
    title: text.max(160).refine(value=>value.length<=160,"Title is too long"),
    body: text.max(2000).refine(value=>value.length<=2000,"Body is too long"),
    image,
    href: url,
    appearance: z.enum(["highlight", "underline"]),
    enabled: z.boolean(),
  })
  .superRefine((annotation, context) => {
    const itemField =
      annotation.field === "work.description" ||
      annotation.field === "projects.description";
    if (itemField === (annotation.itemId === ""))
      context.addIssue({
        code: "custom",
        path: ["itemId"],
        message:
          "Choose an item for work or project text; leave item empty for other fields",
      });
  });
export type PortfolioAnnotation = z.infer<typeof annotationSchema>;
export const resumeSchema = z.strictObject({
  annotations: list(annotationSchema).optional(),
  name: text,
  nickname: text,
  initials: text,
  url,
  location: text,
  locationLink: url,
  description: text,
  summary: text,
  avatarUrl: image,
  skills: list(z.strictObject({ id, name: text, icon })),
  navbar: list(z.strictObject({ id, href: url, icon, label: text })),
  contact: z.strictObject({
    email: text,
    tel: text,
    social: list(
      z.strictObject({ id, name: text, url, icon, navbar: z.boolean() }),
    ),
  }),
  work: list(work),
  education: list(education),
  projects: list(project),
  certifications: list(certification),
  copy: z.strictObject({
    common: copyMap,
    home: copyMap,
    metadata: z.strictObject({ description: text }),
  }),
});
export const documentSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    sections: z
      .array(z.strictObject({ id: z.enum(sectionNames), visible: z.boolean() }))
      .length(8),
    locales: z.strictObject({ vi: resumeSchema, en: resumeSchema }),
  })
  .superRefine((d, ctx) => {
    if (new Set(d.sections.map((x) => x.id)).size !== 8)
      ctx.addIssue({
        code: "custom",
        message: "Sections must be unique",
        path: ["sections"],
      });
    for (const key of [
      "skills",
      "navbar",
      "work",
      "education",
      "projects",
      "certifications",
    ] as const) {
      const a = d.locales.vi[key]
          .map((x) => x.id)
          .sort()
          .join(),
        b = d.locales.en[key]
          .map((x) => x.id)
          .sort()
          .join();
      if (a !== b)
        ctx.addIssue({
          code: "custom",
          message: "Both locales must contain the same IDs",
          path: ["locales", key],
        });
    }
    if (
      d.locales.vi.contact.social
        .map((x) => x.id)
        .sort()
        .join() !==
      d.locales.en.contact.social
        .map((x) => x.id)
        .sort()
        .join()
    )
      ctx.addIssue({
        code: "custom",
        message: "Social IDs must match",
        path: ["locales"],
      });
    for (const l of ["vi", "en"] as const)
      for (const key of ["GitHub", "LinkedIn", "Facebook", "Instagram"])
        if (!d.locales[l].contact.social.some((s) => s.id === key))
          ctx.addIssue({
            code: "custom",
            message: `Required social: ${key}`,
            path: ["locales", l, "contact", "social"],
          });
  });
export type PortfolioDocument = z.infer<typeof documentSchema>;
export type Resume = z.infer<typeof resumeSchema>;
export function parseDocument(value: unknown): PortfolioDocument {
  if (JSON.stringify(value).length > 240000)
    throw new Error("Document too large");
  return documentSchema.parse(value);
}
export function mediaIds(value: unknown): string[] {
  const ids = new Set<string>();
  function walk(v: unknown) {
    if (typeof v === "string" && /^media:[0-9a-f-]{36}$/.test(v))
      ids.add(v.slice(6));
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  }
  walk(value);
  return [...ids];
}
