"use client";

import { useState, useEffect } from "react";
import {
  ArrowDown,
  ArrowUp,
  BriefcaseBusiness,
  GraduationCap,
  FolderGit2,
  Award,
  Code2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { usePortfolioEditor } from "@/app/context/portfolio-context";
import type { Resume } from "@/lib/portfolio/model";
import { resumeSchema } from "@/lib/portfolio/model";
import { iconRegistry } from "@/components/portfolio/icon-registry";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
} from "@/components/ui/card";
import {
  FieldGroup,
  Field,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  AssetThumbnail,
  ImageField,
  IconField,
  TextField,
  useEditorCopy,
} from "./editor-fields";

export type CollectionKey =
  "work" | "education" | "certifications" | "skills" | "projects";
type Entry = Resume[CollectionKey][number];
type Property = {
  key: string;
  vi: string;
  en: string;
  multiline?: boolean;
  hint?: [string, string];
  placeholder?: string;
  lines?: boolean;
};
const config: Record<
  CollectionKey,
  {
    vi: string;
    en: string;
    singular: [string, string];
    description: [string, string];
    icon: typeof Plus;
    titleKey: string;
    imageKey?: string;
    fields: Property[];
  }
> = {
  work: {
    vi: "Kinh nghiệm",
    en: "Experience",
    singular: ["kinh nghiệm", "experience"],
    description: [
      "Vai trò, công ty và những gì bạn đã làm. Thứ tự ở đây cũng là thứ tự trên trang công khai.",
      "Roles, companies and what you worked on. This order is used on your public page.",
    ],
    icon: BriefcaseBusiness,
    titleKey: "company",
    imageKey: "logoUrl",
    fields: [
      { key: "company", vi: "Tên công ty", en: "Company" },
      { key: "title", vi: "Chức danh", en: "Role" },
      {
        key: "companyContext",
        vi: "Thông tin công ty",
        en: "Company context",
        placeholder: "A VULETECH company",
      },
      {
        key: "href",
        vi: "Website công ty",
        en: "Company website",
        placeholder: "https://",
      },
      { key: "start", vi: "Bắt đầu", en: "Start date", placeholder: "09/2026" },
      {
        key: "end",
        vi: "Kết thúc",
        en: "End date",
        hint: [
          "Để trống nếu đang làm việc tại đây.",
          "Leave empty for a current role.",
        ],
      },
      { key: "location", vi: "Địa điểm", en: "Location" },
      {
        key: "badges",
        vi: "Hình thức làm việc",
        en: "Employment labels",
        lines: true,
        hint: [
          "Mỗi nhãn một dòng, ví dụ: Toàn thời gian.",
          "One label per line, e.g. Full-time.",
        ],
      },
      {
        key: "description",
        vi: "Công việc và đóng góp",
        en: "Responsibilities and contributions",
        multiline: true,
      },
    ],
  },
  education: {
    vi: "Học vấn",
    en: "Education",
    singular: ["học vấn", "education"],
    description: [
      "Trường học, ngành học và thời gian theo học.",
      "Schools, degrees and study periods.",
    ],
    icon: GraduationCap,
    titleKey: "school",
    imageKey: "logoUrl",
    fields: [
      { key: "school", vi: "Trường học", en: "School" },
      {
        key: "degree",
        vi: "Ngành học / bằng cấp",
        en: "Degree / field of study",
      },
      { key: "href", vi: "Website trường", en: "School website" },
      { key: "start", vi: "Bắt đầu", en: "Start date" },
      { key: "end", vi: "Kết thúc", en: "End date" },
    ],
  },
  certifications: {
    vi: "Chứng chỉ",
    en: "Certifications",
    singular: ["chứng chỉ", "certification"],
    description: [
      "Các chứng chỉ và liên kết xác thực của bạn.",
      "Credentials and links to verify them.",
    ],
    icon: Award,
    titleKey: "name",
    imageKey: "logoUrl",
    fields: [
      { key: "name", vi: "Tên chứng chỉ", en: "Certification name" },
      { key: "issuer", vi: "Đơn vị cấp", en: "Issuer" },
      {
        key: "href",
        vi: "Liên kết chứng chỉ",
        en: "Credential URL",
        placeholder: "https://",
      },
    ],
  },
  skills: {
    vi: "Kỹ năng",
    en: "Skills",
    singular: ["kỹ năng", "skill"],
    description: [
      "Chọn tên và biểu tượng cho từng công nghệ bạn muốn giới thiệu.",
      "Choose a name and icon for each technology you want to highlight.",
    ],
    icon: Code2,
    titleKey: "name",
    fields: [{ key: "name", vi: "Tên kỹ năng", en: "Skill name" }],
  },
  projects: {
    vi: "Dự án",
    en: "Projects",
    singular: ["dự án", "project"],
    description: [
      "Chọn các dự án tiêu biểu, ảnh bìa và liên kết để người xem khám phá.",
      "Showcase selected work with cover images and links.",
    ],
    icon: FolderGit2,
    titleKey: "title",
    imageKey: "image",
    fields: [
      { key: "title", vi: "Tên dự án", en: "Project title" },
      {
        key: "href",
        vi: "Liên kết chính",
        en: "Project URL",
        placeholder: "https://",
      },
      {
        key: "dates",
        vi: "Thời gian",
        en: "Period",
        placeholder: "01/2026 – 06/2026",
      },
      {
        key: "description",
        vi: "Mô tả dự án",
        en: "Description",
        multiline: true,
      },
      {
        key: "technologies",
        vi: "Công nghệ sử dụng",
        en: "Technologies",
        lines: true,
        hint: ["Mỗi công nghệ một dòng.", "One technology per line."],
      },
    ],
  },
};
function newEntry(key: CollectionKey): Entry {
  const id = crypto.randomUUID();
  switch (key) {
    case "work":
      return {
        id,
        company: "",
        title: "",
        href: "",
        location: "",
        start: "",
        end: "",
        description: "",
        badges: [],
        logoUrl: "",
        logoClassName: "",
      };
    case "education":
      return {
        id,
        school: "",
        degree: "",
        href: "",
        start: "",
        end: "",
        logoUrl: "",
      };
    case "certifications":
      return { id, name: "", issuer: "", href: "", logoUrl: "" };
    case "skills":
      return { id, name: "", icon: "Typescript" };
    case "projects":
      return {
        id,
        title: "",
        href: "",
        dates: "",
        description: "",
        technologies: [],
        links: [],
        image: "",
        video: "",
        active: true,
      };
  }
}
function properties(entry: Entry) {
  return entry as unknown as Record<
    string,
    string | boolean | string[] | Resume["projects"][number]["links"]
  >;
}

export function CollectionEditor({ section }: { section: CollectionKey }) {
  const store = usePortfolioEditor(),
    t = useEditorCopy(),
    spec = config[section];
  const [editing, setEditing] = useState<Entry | null>(null),
    [remove, setRemove] = useState<Entry | null>(null),
    [formErrors, setFormErrors] = useState<Record<string, string>>({}),
    [cancelConfirm, setCancelConfirm] = useState(false),
    [original, setOriginal] = useState("");
  const resume = store.doc!.locales[store.locale],
    entries = resume[section] as Entry[];
  const dialogDirty = !!editing && JSON.stringify(editing) !== original;
  useEffect(() => {
    if (!dialogDirty) return;
    const guard = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dialogDirty]);
  const Icon = spec.icon;
  const commit = (next: Entry[]) =>
    store.updateResume(
      (current) => ({ ...current, [section]: next }) as Resume,
    );
  function edit(entry: Entry) {
    setEditing(structuredClone(entry));
    setOriginal(JSON.stringify(entry));
    setFormErrors({});
  }
  function close() {
    if (editing && JSON.stringify(editing) !== original) setCancelConfirm(true);
    else setEditing(null);
  }
  function save() {
    if (!editing) return;
    const values = properties(editing),
      errors: Record<string, string> = {};
    if (!String(values[spec.titleKey] ?? "").trim())
      errors[spec.titleKey] = t("Vui lòng nhập tên.", "Enter a name.");
    const next = entries.some((item) => item.id === editing.id)
      ? entries.map((item) => (item.id === editing.id ? editing : item))
      : [...entries, editing];
    const parsed = resumeSchema.safeParse({ ...resume, [section]: next });
    if (!parsed.success)
      for (const issue of parsed.error.issues)
        if (issue.path[0] === section)
          errors[String(issue.path[2])] = t(
            "Giá trị không hợp lệ. Kiểm tra độ dài hoặc định dạng liên kết https://.",
            "Invalid value. Check the length or use an https:// URL.",
          );
    setFormErrors(errors);
    if (Object.keys(errors).length) {
      requestAnimationFrame(() =>
        document
          .querySelector<HTMLElement>('[role="dialog"] [aria-invalid="true"]')
          ?.focus(),
      );
      return;
    }
    commit(next);
    setEditing(null);
  }
  function move(index: number, by: number) {
    const next = [...entries];
    [next[index], next[index + by]] = [next[index + by], next[index]];
    commit(next);
  }
  const values = editing ? properties(editing) : {};
  const set = (key: string, value: unknown) =>
    setEditing((current) =>
      current ? ({ ...current, [key]: value } as Entry) : null,
    );
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t(spec.vi, spec.en)}</CardTitle>
          <CardDescription>{t(...spec.description)}</CardDescription>
          <CardAction>
            <Button
              disabled={store.busy}
              onClick={() => edit(newEntry(section))}
            >
              <Plus data-icon="inline-start" />
              {t("Thêm", "Add")}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="@container/collection">
          <div
            className={cn(
              "flex flex-col divide-y",
              (section === "skills" || section === "projects") &&
                "grid grid-cols-1 gap-4 divide-y-0 @xl/collection:grid-cols-2",
              section === "skills" && "@3xl/collection:grid-cols-3",
            )}
          >
            {entries.length ? (
              entries.map((entry, index) => {
                const row = properties(entry),
                  title = String(
                    row[spec.titleKey] || t("Chưa đặt tên", "Untitled"),
                  );
                const subtitle = [
                  row.title && section === "work"
                    ? row.title
                    : (row.degree ?? row.issuer ?? row.dates),
                  row.start
                    ? `${row.start} – ${row.end || t("Hiện tại", "Present")}`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ");
                const SkillIcon =
                  section === "skills"
                    ? iconRegistry[(entry as Resume["skills"][number]).icon]
                    : Icon;
                return (
                  <div
                    key={entry.id}
                    className={cn(
                      "flex flex-wrap items-center gap-3 py-4 first:pt-0 last:pb-0",
                      section === "skills" &&
                        "rounded-xl border p-4 first:pt-4 last:pb-4",
                      section === "projects" &&
                        "flex-col items-stretch gap-0 overflow-hidden rounded-xl border p-0 first:pt-0 last:pb-0",
                    )}
                  >
                    {spec.imageKey ? (
                      <AssetThumbnail
                        value={String(row[spec.imageKey] || "")}
                        label={title}
                        variant={section === "projects" ? "cover" : "thumbnail"}
                      />
                    ) : (
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <SkillIcon
                          className={cn(
                            "size-5 text-muted-foreground",
                            section === "skills" && "size-8 text-foreground",
                          )}
                          aria-hidden
                        />
                      </div>
                    )}
                    <div
                      className={cn(
                        "min-w-0 flex-1 basis-40",
                        section === "skills" && "basis-0",
                        section === "projects" && "basis-auto p-4",
                      )}
                    >
                      <p className="font-medium">{title}</p>
                      {section === "projects" && !row.active && (
                        <Badge variant="outline">
                          {t("Đang ẩn", "Hidden")}
                        </Badge>
                      )}
                      {subtitle && (
                        <p className="text-sm text-muted-foreground">
                          {subtitle}
                        </p>
                      )}
                      {section === "projects" && (
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                          {String(row.description || "")}
                        </p>
                      )}
                    </div>
                    <div
                      className={cn(
                        "flex items-center gap-1",
                        section === "skills" &&
                          "w-full justify-end border-t pt-3",
                        section === "projects" &&
                          "mt-auto justify-end px-4 pb-4",
                      )}
                    >
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`${t("Đưa lên", "Move up")}: ${title}`}
                        disabled={!index || store.busy}
                        onClick={() => move(index, -1)}
                      >
                        <ArrowUp />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`${t("Đưa xuống", "Move down")}: ${title}`}
                        disabled={index === entries.length - 1 || store.busy}
                        onClick={() => move(index, 1)}
                      >
                        <ArrowDown />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={store.busy}
                        onClick={() => edit(entry)}
                      >
                        <Pencil data-icon="inline-start" />
                        {t("Sửa", "Edit")}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={store.busy}
                        aria-label={`${t("Xóa", "Delete")}: ${title}`}
                        onClick={() => setRemove(entry)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Icon />
                  </EmptyMedia>
                  <EmptyTitle>
                    {t("Chưa có nội dung", "No items yet")}
                  </EmptyTitle>
                  <EmptyDescription>
                    {t(
                      "Thêm mục đầu tiên để giới thiệu trên portfolio.",
                      "Add the first item to your portfolio.",
                    )}
                  </EmptyDescription>
                </EmptyHeader>
                <Button onClick={() => edit(newEntry(section))}>
                  <Plus data-icon="inline-start" />
                  {t("Thêm", "Add")}
                </Button>
              </Empty>
            )}
          </div>
        </CardContent>
      </Card>
      <CollectionHeadings section={section} />
      <Dialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) close();
        }}
      >
        <DialogContent
          size={section === "skills" ? "sm" : "lg"}
          closeLabel={t("Đóng", "Close")}
        >
          <DialogHeader>
            <DialogTitle>
              {t("Chỉnh sửa", "Edit")} {t(...spec.singular)}
            </DialogTitle>
            <DialogDescription>
              {t("Chỉnh sửa bản", "Editing")}{" "}
              {store.locale === "vi" ? "Tiếng Việt" : "English"}.{" "}
              {t(
                "Áp dụng để đưa vào bản nháp; trang công khai chưa thay đổi.",
                "Apply to the draft; your public page stays unchanged.",
              )}
            </DialogDescription>
          </DialogHeader>
          {Object.keys(formErrors).length > 0 && (
            <Alert variant="destructive">
              <AlertTitle>
                {t("Kiểm tra lại nội dung", "Review the fields")}
              </AlertTitle>
              <AlertDescription>
                {Object.entries(formErrors).map(([key, error]) => (
                  <p key={key}>
                    {spec.fields.find((f) => f.key === key)?.[
                      store.language === "vi" ? "vi" : "en"
                    ] ?? t("Nội dung", "Content")}
                    : {error}
                  </p>
                ))}
              </AlertDescription>
            </Alert>
          )}
          <FieldGroup
            className={cn(
              "gap-6",
              section === "projects" &&
                "grid items-start md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]",
            )}
          >
            {spec.imageKey && (
              <FieldGroup
                className={cn(
                  section === "projects" && "md:col-start-2 md:row-start-1",
                )}
              >
                <ImageField
                  label={
                    section === "projects"
                      ? t("Ảnh bìa dự án", "Project cover")
                      : t("Ảnh đại diện", "Image")
                  }
                  value={String(values[spec.imageKey] || "")}
                  onChange={(value) => set(spec.imageKey!, value)}
                  variant={section === "projects" ? "cover" : "thumbnail"}
                />
                {section === "projects" && (
                  <FieldDescription>
                    {t(
                      "Ảnh xem trước trên thẻ dự án. Nên chọn ảnh ngang 16:9.",
                      "Cover shown on the project card. A landscape 16:9 image works best.",
                    )}
                  </FieldDescription>
                )}
              </FieldGroup>
            )}
            <FieldGroup
              className={cn(
                section === "projects"
                  ? "md:col-start-1 md:row-start-1"
                  : section !== "skills" &&
                      "grid items-start gap-5 sm:grid-cols-2",
              )}
            >
              {spec.fields.map((field) => (
                <TextField
                  key={field.key}
                  className={cn(
                    (field.multiline || field.lines) &&
                      section !== "projects" &&
                      "sm:col-span-2",
                  )}
                  label={t(field.vi, field.en)}
                  error={formErrors[field.key]}
                  value={
                    field.lines
                      ? ((values[field.key] as string[]) ?? []).join("\n")
                      : String(values[field.key] ?? "")
                  }
                  onChange={(value) =>
                    set(
                      field.key,
                      field.lines ? value.split("\n").filter(Boolean) : value,
                    )
                  }
                  multiline={field.multiline || field.lines}
                  description={field.hint && t(...field.hint)}
                  placeholder={field.placeholder}
                  rows={field.multiline ? 4 : 3}
                />
              ))}
            </FieldGroup>
            {section === "skills" && (
              <IconField
                value={String(values.icon)}
                onChange={(value) => set("icon", value)}
              />
            )}
            {section === "projects" && (
              <Field orientation="horizontal" className="md:col-span-2">
                <FieldLabel htmlFor="project-visible">
                  {t("Hiển thị dự án", "Show project")}
                </FieldLabel>
                <Switch
                  id="project-visible"
                  checked={Boolean(values.active)}
                  onCheckedChange={(active) => set("active", active)}
                />
              </Field>
            )}
            {section === "projects" && (
              <FieldGroup className="md:col-span-2">
                <ProjectLinks
                  links={
                    (values.links ?? []) as Resume["projects"][number]["links"]
                  }
                  onChange={(links) => set("links", links)}
                />
              </FieldGroup>
            )}
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={close}>
              {t("Hủy", "Cancel")}
            </Button>
            <Button onClick={save}>
              {t("Áp dụng vào bản nháp", "Apply to draft")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!remove} onOpenChange={(open) => !open && setRemove(null)}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>{t("Xóa mục này?", "Delete this item?")}</DialogTitle>
            <DialogDescription>
              {t(
                "Mục này sẽ được gỡ khỏi cả hai ngôn ngữ trong bản nháp. Trang công khai chỉ thay đổi sau khi xuất bản.",
                "This removes the item from both draft languages. The public page changes only after publishing.",
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemove(null)}>
              {t("Giữ lại", "Keep item")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                commit(entries.filter((item) => item.id !== remove?.id));
                setRemove(null);
              }}
            >
              {t("Xóa khỏi bản nháp", "Delete from draft")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={cancelConfirm} onOpenChange={setCancelConfirm}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>
              {t("Bỏ thay đổi trong mục này?", "Discard changes to this item?")}
            </DialogTitle>
            <DialogDescription>
              {t(
                "Các chỉnh sửa trong hộp thoại chưa được áp dụng vào bản nháp.",
                "Edits in this dialog have not been applied to your draft.",
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelConfirm(false)}>
              {t("Tiếp tục sửa", "Keep editing")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setCancelConfirm(false);
                setEditing(null);
              }}
            >
              {t("Bỏ thay đổi", "Discard")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ProjectLinks({
  links,
  onChange,
}: {
  links: Resume["projects"][number]["links"];
  onChange: (links: Resume["projects"][number]["links"]) => void;
}) {
  const t = useEditorCopy();
  return (
    <Field>
      <FieldLabel>{t("Liên kết bổ sung", "Additional links")}</FieldLabel>
      <FieldDescription>
        {t(
          "Ví dụ: mã nguồn, demo hoặc tài liệu dự án.",
          "For example: source code, demo or documentation.",
        )}
      </FieldDescription>
      {links.map((link) => (
        <FieldGroup
          key={link.id}
          className="grid items-start gap-5 rounded-lg border p-4 sm:grid-cols-2"
        >
          <TextField
            label={t("Nhãn liên kết", "Link label")}
            value={link.type}
            onChange={(type) =>
              onChange(
                links.map((l) => (l.id === link.id ? { ...l, type } : l)),
              )
            }
          />
          <TextField
            label="URL"
            value={link.href}
            onChange={(href) =>
              onChange(
                links.map((l) => (l.id === link.id ? { ...l, href } : l)),
              )
            }
          />
          <IconField
            value={link.icon}
            onChange={(icon) =>
              onChange(
                links.map((l) =>
                  l.id === link.id
                    ? { ...l, icon: icon as typeof link.icon }
                    : l,
                ),
              )
            }
          />
          <Button
            variant="ghost"
            onClick={() => onChange(links.filter((l) => l.id !== link.id))}
          >
            {t("Gỡ liên kết", "Remove link")}
          </Button>
        </FieldGroup>
      ))}
      <Button
        variant="outline"
        onClick={() =>
          onChange([
            ...links,
            { id: crypto.randomUUID(), type: "", href: "", icon: "HomeIcon" },
          ])
        }
      >
        <Plus data-icon="inline-start" />
        {t("Thêm liên kết", "Add link")}
      </Button>
    </Field>
  );
}

function CollectionHeadings({ section }: { section: CollectionKey }) {
  const store = usePortfolioEditor(),
    t = useEditorCopy(),
    resume = store.doc!.locales[store.locale];
  const fields =
    section === "projects"
      ? [
          ["projectsEyebrow", t("Nhãn mục", "Section label")],
          ["projectsTitle", t("Tiêu đề", "Heading")],
          [
            "projectsDescription",
            t("Giới thiệu mục dự án", "Projects introduction"),
          ],
        ]
      : [[section, t("Tiêu đề mục", "Section heading")]];
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>{t("Tiêu đề hiển thị", "Section heading")}</CardTitle>
        <CardDescription>
          {t(
            "Nội dung phía trên danh sách trên trang công khai.",
            "The text shown above this list on your public page.",
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup className="grid gap-5 sm:grid-cols-2">
          {fields.map(([key, label]) => (
            <TextField
              key={key}
              className={
                key === "projectsDescription" ? "sm:col-span-2" : undefined
              }
              label={label}
              value={resume.copy.home[key] ?? ""}
              onChange={(value) =>
                store.updateResume((current) => ({
                  ...current,
                  copy: {
                    ...current.copy,
                    home: { ...current.copy.home, [key]: value },
                  },
                }))
              }
              multiline={key === "projectsDescription"}
            />
          ))}
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
