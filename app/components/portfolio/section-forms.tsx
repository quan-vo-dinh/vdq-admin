"use client";
import type { ReactNode } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { usePortfolioEditor } from "@/app/context/portfolio-context";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
  FieldSet,
  FieldLegend,
  FieldContent,
} from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { Resume } from "@/lib/portfolio/model";
import { TextField, ImageField, useEditorCopy } from "./editor-fields";
function FormCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="@container/portfolio-form">
        <FieldGroup>{children}</FieldGroup>
      </CardContent>
    </Card>
  );
}
export function ResumeEditor({
  section,
}: {
  section: "identity" | "about" | "contact" | "seo";
}) {
  const store = usePortfolioEditor(),
    t = useEditorCopy(),
    resume = store.doc!.locales[store.locale];
  const field = (
    key: keyof Resume,
    label: string,
    description?: string,
    multiline = false,
  ) => (
    <TextField
      key={key}
      label={label}
      value={String(resume[key] ?? "")}
      onChange={(value) =>
        store.updateResume((current) => ({ ...current, [key]: value }))
      }
      path={`locales.${store.locale}.${key}`}
      description={description}
      multiline={multiline}
      rows={key === "summary" ? 12 : 4}
    />
  );
  function copy(key: string, label: string, multiline = false) {
    return (
      <TextField
        key={key}
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
        multiline={multiline}
      />
    );
  }
  if (section === "identity")
    return (
      <FormCard
        title={t("Thông tin cá nhân", "Profile")}
        description={t(
          "Ấn tượng đầu tiên của người xem khi mở portfolio.",
          "The first thing visitors see when opening your portfolio.",
        )}
      >
        <FieldGroup className="grid items-start gap-6 @2xl/portfolio-form:grid-cols-[minmax(0,1fr)_minmax(14rem,18rem)]">
          <FieldGroup className="min-w-0">
            <FieldGroup className="grid gap-5 sm:grid-cols-2">
              {field("name", t("Họ và tên", "Full name"))}
              {field("nickname", t("Tên gọi", "Nickname"))}
              {copy("greeting", t("Lời chào", "Greeting"))}
              {field(
                "initials",
                t("Chữ viết tắt", "Initials"),
                t(
                  "Hiển thị khi ảnh chưa tải được.",
                  "Shown when your portrait cannot load.",
                ),
              )}
            </FieldGroup>
            {field(
              "description",
              t("Giới thiệu ngắn", "Short introduction"),
              t(
                "Một đến hai câu về vai trò và chuyên môn của bạn.",
                "One or two sentences about your role and focus.",
              ),
              true,
            )}
            <FieldGroup className="grid gap-5 sm:grid-cols-2">
              {field("location", t("Địa điểm", "Location"))}
              {field("locationLink", t("Liên kết bản đồ", "Map link"))}
            </FieldGroup>
          </FieldGroup>
          <FieldGroup className="min-w-0 rounded-xl border bg-muted/20 p-4">
            <ImageField
              value={resume.avatarUrl}
              onChange={(avatarUrl) =>
                store.updateResume((current) => ({ ...current, avatarUrl }))
              }
              label={t("Ảnh chân dung", "Portrait")}
              variant="portrait"
            />
            <FieldDescription>
              {t(
                "Ảnh đại diện hiển thị ở phần đầu portfolio và khi chia sẻ trang.",
                "Your portrait appears at the top of your portfolio and when sharing it.",
              )}
            </FieldDescription>
          </FieldGroup>
        </FieldGroup>
      </FormCard>
    );
  if (section === "about")
    return (
      <FormCard
        title={t("Giới thiệu", "About")}
        description={t(
          "Kể câu chuyện nghề nghiệp bằng giọng văn của bạn.",
          "Tell your professional story in your own voice.",
        )}
      >
        {copy("about", t("Tiêu đề mục", "Section heading"))}
        {field(
          "summary",
          t("Nội dung giới thiệu", "About text"),
          t(
            "Hỗ trợ Markdown. Đoạn đầu là phần xem nhanh; các đoạn sau xuất hiện khi bấm Xem thêm.",
            "Markdown supported. The first paragraph is the preview; remaining paragraphs appear after Read more.",
          ),
          true,
        )}
        <FieldGroup className="grid gap-5 sm:grid-cols-2">
          {copy("aboutShowMore", t("Nhãn mở rộng", "Expand label"))}
          {copy("aboutShowLess", t("Nhãn thu gọn", "Collapse label"))}
        </FieldGroup>
      </FormCard>
    );
  if (section === "seo")
    return (
      <FormCard
        title={t("Hiển thị trên tìm kiếm", "Search appearance")}
        description={t(
          "Nội dung khi trang xuất hiện trên công cụ tìm kiếm và được chia sẻ.",
          "How your site appears in search and when shared.",
        )}
      >
        <div className="rounded-lg border bg-muted/20 p-4">
          <p className="text-sm text-muted-foreground">
            {t("Xem trước kết quả tìm kiếm", "Search result preview")}
          </p>
          <p className="mt-2 text-lg font-medium">{resume.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {resume.copy.metadata.description || resume.description}
          </p>
        </div>
        <TextField
          label={t("Mô tả tìm kiếm", "Search description")}
          value={resume.copy.metadata.description}
          onChange={(description) =>
            store.updateResume((current) => ({
              ...current,
              copy: { ...current.copy, metadata: { description } },
            }))
          }
          multiline
          description={t(
            "Viết một đoạn ngắn giới thiệu rõ trang này là của ai và về điều gì.",
            "Write a short description of who you are and what this site covers.",
          )}
        />
        <FieldDescription>
          {t(
            "Tiêu đề dùng họ tên của bạn. Ảnh chia sẻ dùng ảnh chân dung; đường dẫn chuẩn được cấu hình tự động.",
            "The title uses your full name. Social sharing uses your portrait; the canonical URL is configured automatically.",
          )}
        </FieldDescription>
      </FormCard>
    );
  return (
    <FormCard
      title={t("Liên hệ", "Contact")}
      description={t(
        "Cách người xem có thể liên hệ và tìm thấy bạn.",
        "How visitors can get in touch and find you.",
      )}
    >
      <FieldGroup className="grid items-start gap-6 @2xl/portfolio-form:grid-cols-2">
        <FieldGroup className="min-w-0">
          {copy("contactTitle", t("Lời mời liên hệ", "Contact heading"))}
          <FieldSet>
            <FieldLegend>
              {t("Nội dung lời mời", "Contact message")}
            </FieldLegend>
            <FieldDescription>
              {t(
                "Câu liên hệ gồm phần mở đầu, liên kết LinkedIn và phần kết.",
                "The contact sentence has an introduction, a LinkedIn link and a closing phrase.",
              )}
            </FieldDescription>
            <FieldGroup>
              {copy(
                "contactBeforeLink",
                t("Trước liên kết", "Before the link"),
              )}
              {copy(
                "contactLink",
                t("Nhãn liên kết LinkedIn", "LinkedIn link text"),
              )}
              {copy("contactAfterLink", t("Sau liên kết", "After the link"))}
            </FieldGroup>
          </FieldSet>
        </FieldGroup>
        <FieldGroup className="min-w-0">
          <FieldSet>
            <FieldLegend>{t("Mạng xã hội", "Social profiles")}</FieldLegend>
            <FieldDescription>
              {t(
                "Bốn liên kết chính xuất hiện dưới mục Liên hệ.",
                "The four main profiles appear in the Contact section.",
              )}
            </FieldDescription>
            <FieldGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {resume.contact.social
                .filter((s) =>
                  ["GitHub", "LinkedIn", "Facebook", "Instagram"].includes(
                    s.id,
                  ),
                )
                .map((social) => (
                  <TextField
                    key={social.id}
                    label={social.name}
                    value={social.url}
                    onChange={(url) =>
                      store.updateResume((current) => ({
                        ...current,
                        contact: {
                          ...current.contact,
                          social: current.contact.social.map((item) =>
                            item.id === social.id ? { ...item, url } : item,
                          ),
                        },
                      }))
                    }
                    path={`locales.${store.locale}.contact.social.${resume.contact.social.indexOf(social)}.url`}
                  />
                ))}
            </FieldGroup>
          </FieldSet>
          <FieldGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <TextField
              label="Email"
              description={t(
                "Lưu trong hồ sơ; bố cục hiện tại chỉ hiển thị mạng xã hội.",
                "Stored in your profile; the current layout displays social links only.",
              )}
              value={resume.contact.email}
              onChange={(email) =>
                store.updateResume((current) => ({
                  ...current,
                  contact: { ...current.contact, email },
                }))
              }
            />
            <TextField
              label={t("Số điện thoại", "Phone")}
              description={t(
                "Không hiển thị trên trang công khai hiện tại.",
                "Not displayed on the current public page.",
              )}
              value={resume.contact.tel}
              onChange={(tel) =>
                store.updateResume((current) => ({
                  ...current,
                  contact: { ...current.contact, tel },
                }))
              }
            />
          </FieldGroup>
        </FieldGroup>
      </FieldGroup>
    </FormCard>
  );
}
const sectionLabels: Record<string, [string, string]> = {
  hero: ["Thông tin cá nhân", "Profile"],
  about: ["Giới thiệu", "About"],
  work: ["Kinh nghiệm", "Experience"],
  education: ["Học vấn", "Education"],
  certifications: ["Chứng chỉ", "Certifications"],
  skills: ["Kỹ năng", "Skills"],
  projects: ["Dự án", "Projects"],
  contact: ["Liên hệ", "Contact"],
};
export function LayoutEditor() {
  const store = usePortfolioEditor(),
    t = useEditorCopy(),
    document = store.doc!;
  function move(index: number, by: number) {
    const next = [...document.sections];
    [next[index], next[index + by]] = [next[index + by], next[index]];
    store.setDoc({ ...document, sections: next });
  }
  return (
    <FormCard
      title={t("Bố cục trang", "Page layout")}
      description={t(
        "Bật/tắt và sắp xếp các phần trên trang công khai. Nội dung được giữ khi bạn ẩn một mục.",
        "Show, hide and reorder public sections. Hiding a section preserves its content.",
      )}
    >
      <FieldSet>
        <FieldLegend className="sr-only">
          {t("Các phần hiển thị", "Visible sections")}
        </FieldLegend>
        <FieldGroup className="gap-0 divide-y">
          {document.sections.map((item, index) => {
            const label = t(...sectionLabels[item.id]);
            return (
              <Field
                key={item.id}
                orientation="horizontal"
                className="py-4 first:pt-0"
              >
                <FieldContent>
                  <FieldLabel htmlFor={`section-${item.id}`}>
                    {label}
                  </FieldLabel>
                  <FieldDescription>
                    {item.visible
                      ? t("Hiển thị trên trang", "Visible on your site")
                      : t("Đang ẩn", "Hidden")}
                  </FieldDescription>
                </FieldContent>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`${t("Đưa lên", "Move up")}: ${label}`}
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`${t("Đưa xuống", "Move down")}: ${label}`}
                    disabled={index === document.sections.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown />
                  </Button>
                  <Switch
                    id={`section-${item.id}`}
                    checked={item.visible}
                    onCheckedChange={(visible) =>
                      store.setDoc({
                        ...document,
                        sections: document.sections.map((s) =>
                          s.id === item.id ? { ...s, visible } : s,
                        ),
                      })
                    }
                  />
                </div>
              </Field>
            );
          })}
        </FieldGroup>
      </FieldSet>
    </FormCard>
  );
}
