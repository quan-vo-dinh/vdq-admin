"use client";
import { apiFetch } from "@/lib/api/transport";

import { FinancePageHeader } from "./page-header";
import { DashboardCard } from "@/app/components/shared/dashboard-card";
import { FinanceBoard } from "./template-layout";
import StyleDivider from "@/app/components/shared/StyleDivider";
import { FinanceHeading } from "./heading";
import { DateField } from "./controls";
import { useFinanceLocale } from "./locale";
import { useState, useEffect } from "react";
import {
  ShieldCheck,
  Plus,
  Pencil,
  Trash2,
  Wallet,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
  CardFooter,
} from "@/components/ui/card";
import {
  FieldGroup,
  Field,
  FieldLabel,
  FieldError,
  FieldDescription,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useFinance } from "@/app/context/finance-context";
import { overview, type Goal } from "@/lib/finance/model";
import {
  Metric,
  MoneyInput,
  FinanceBadge,
  NoResults,
} from "./shared";
import { ProgressRing } from "./dashboard-widgets";
import type { FinanceTone } from "./appearance";
import { GoalCover, GoalVisualPicker } from "./goal-visuals";
function GoalEditor({
  initial,
  onClose,
}: {
  initial?: Goal;
  onClose: () => void;
}) {
  const { text, money } = useFinanceLocale();
  const { data: loaded, action, busy, notify, reload: actionRefresh } = useFinance();
  const data = loaded!,
    totals = overview(data);
  const [createId] = useState(() => crypto.randomUUID());
  const [name, setName] = useState(initial?.name ?? "");
  const [target, setTarget] = useState(initial?.target ?? 10_000_000);
  const [allocated, setAllocated] = useState(initial?.allocated ?? 0);
  const [monthly, setMonthly] = useState(initial?.monthly ?? 500_000);
  const [deadline, setDeadline] = useState(initial?.deadline ?? data.asOf);
  const [visual, setVisual] = useState(initial?.visual ?? "study");
  const [image, setImage] = useState(initial?.image ?? "");
  const [imageError, setImageError] = useState("");
  const [file,setFile]=useState<File>();
  const [removeImage,setRemoveImage]=useState(false);
  const [savedRevision,setSavedRevision]=useState<number>();
  useEffect(()=>()=>{if(image.startsWith("blob:"))URL.revokeObjectURL(image);},[image]);
  const [readingImage,setReadingImage]=useState(false);
  const [error, setError] = useState("");
  const max = Math.max(
    0,
    totals.balanceKnown ? totals.available + (initial?.allocated ?? 0) : (initial?.allocated ?? 0),
  );
  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent size="md"
        data-readable-feature data-finance-typography
        closeLabel={text("Đóng")}
        className="max-h-[90dvh] overflow-y-auto "
      >
        <DialogHeader>
          <DialogTitle>
            <FinanceHeading as="span">
              {initial
                ? text("Điều chỉnh mục tiêu")
                : text("Điều bạn muốn dành tiền cho")}
            </FinanceHeading>
          </DialogTitle>
          <DialogDescription>
            {text(
              "Phân bổ là giữ chỗ trong số tiền hiện có, không tạo thêm số dư hay giao dịch chi tiêu.",
            )}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (readingImage) return;
            if (
              !name.trim() ||
              target <= 0 ||
              allocated > target ||
              allocated > max ||
              !deadline ||
              ![target, allocated, monthly].every(Number.isSafeInteger)
            ) {
              setError(
                "Kiểm tra tên, mục tiêu dương, ngày hợp lệ và số tiền phân bổ không vượt mục tiêu hoặc nguồn còn trống.",
              );
              return;
            }
            const goal: Goal = {
              id: initial?.id ?? createId,
              name: name.trim(),
              target,
              allocated,
              monthly,
              deadline,
              priority: initial?.priority ?? "normal",
              visual,

            };
            setReadingImage(true);
            try {
              const saved=await action('goals',initial||savedRevision?'PATCH':'POST',{...goal, expectedRevision:savedRevision??initial?.revision});
              setSavedRevision(saved.revision);
              if(file||removeImage){
                const r=await apiFetch(`/api/finance/goals/image?id=${goal.id}&revision=${saved.revision}`,{method:file?'POST':'DELETE',headers:file?{'Content-Type':file.type}:undefined,body:file});
                if(!r.ok)throw new Error(r.status===409?'Mục tiêu đã thay đổi. Ảnh cũ được giữ; tải lại trước khi lưu.':'Đã lưu thông tin mục tiêu, nhưng chưa lưu ảnh. Giữ bản nháp để thử lại.');
                const attached=await r.json();setSavedRevision(attached.revision);
                if(attached.cleanupPending)notify('Đã lưu ảnh; ảnh cũ cần dọn qua media cleanup.');
                await actionRefresh();
              }
            }
            catch(e) {setError(e instanceof Error?e.message:'Không lưu được.');return;} finally {setReadingImage(false);}
            notify("Đã lưu mục tiêu và tính lại phần tiền chưa phân bổ.");
            onClose();
          }}
          className="flex flex-col gap-5"
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="goal-name">
                {text("Tên mục tiêu")}
              </FieldLabel>
              <Input
                id="goal-name"
                placeholder={text("Ví dụ: Quỹ ra ở riêng")}
                required
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>{text("Biểu tượng và ảnh")}</FieldLabel>
              <GoalVisualPicker value={visual} onChange={setVisual} />
            </Field>
            <Field data-invalid={Boolean(imageError)}>
              <FieldLabel htmlFor="goal-image">{text("Ảnh riêng cho mục tiêu")}</FieldLabel>
              <Input
                id="goal-image"
                disabled={busy}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-invalid={Boolean(imageError)}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
                    setImageError("Chọn ảnh JPG, PNG hoặc WebP, tối đa 2 MB.");
                    event.target.value = "";
                    return;
                  }
                  setFile(file);setRemoveImage(false);setImage(URL.createObjectURL(file));setImageError("");

                }}
              />
              <FieldDescription>{text("JPG, PNG hoặc WebP, tối đa 2 MiB. Ảnh riêng chỉ lưu sau khi nhấn Lưu.")}</FieldDescription>
              {imageError && <FieldError>{text(imageError)}</FieldError>}
              {image && (
                <div className="finance-goal-image-preview">
                  <GoalCover visual={visual} image={image} alt={name || text("Mục tiêu")} />
                  <Button type="button" variant="ghost" size="sm" onClick={() => {setImage("");setFile(undefined);setRemoveImage(true);}}>{text("Dùng ảnh có sẵn")}</Button>
                </div>
              )}
            </Field>
            <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <MoneyInput
                id="goal-target"
                label={text("Số tiền cần có (VND)")}
                value={target}
                onChange={setTarget}
              />
              <MoneyInput
                id="goal-allocated"
                label={text("Đang phân bổ (VND)")}
                value={allocated}
                onChange={setAllocated}
                description={text("Nguồn có thể dùng: {0}", [money(max)])}
              />
            </FieldGroup>
            <MoneyInput
              sliderMax={10_000_000}
              id="goal-monthly"
              label={text("Dự kiến góp mỗi tháng (VND)")}
              value={monthly}
              onChange={setMonthly}
              description={text(
                "Đây là kế hoạch. Không tự cộng vào tiền đã dành.",
              )}
            />
            <DateField
              id="goal-deadline"
              label="Mốc mong muốn"
              value={deadline}
              onChange={setDeadline}
            />
            {error && <FieldError>{text(error)}</FieldError>}
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {text("Hủy")}
            </Button>
            <Button type="submit" disabled={readingImage || busy}>{text("Lưu mục tiêu")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
export function GoalsPage() {
  const { text, money, date, message, goalName } = useFinanceLocale();
  const { data: loaded, action, busy, notify } = useFinance();
  const data = loaded!,
    totals = overview(data);
  const [mutationError, setMutationError] = useState("");
  const [editor, setEditor] = useState<Goal | "new">();
  const [funding, setFunding] = useState<Goal>();
  const [amount, setAmount] = useState(500_000);
  const [deleting, setDeleting] = useState<Goal>();
  const fundLimit = funding
    ? Math.max(
        0,
        Math.min(totals.available, funding.target - funding.allocated),
      )
    : 0;
  return (
    <div className="finance-page finance-goals">
      <FinancePageHeader>
        <Button variant="outline" onClick={() => setEditor("new")}>
          <Plus data-icon="inline-start" />
          {text("Tạo mục tiêu")}
        </Button>
      </FinancePageHeader>
      <FinanceBoard>
        <div className="finance-metrics finance-metrics-two">
          <Metric
            tone="goal"
            label={text("Đã dành cho mục tiêu")}
            value={money(totals.allocated)}
            detail={text("Nằm trong tổng số dư hiện tại")}
            icon={ShieldCheck}
          />
          <Metric
            label={text("Tiền còn chưa phân bổ")}
            value={totals.balanceKnown?money(totals.available):"Chưa đủ dữ liệu"}
            detail={text("Sau mục tiêu và khoản chi đã khai báo")}
            icon={Wallet}
            negative={totals.available < 0}
          />
        </div>
        {totals.available < 0 && (
          <Alert variant="destructive">
            <AlertDescription>
              {text("Tiền đã dành và nghĩa vụ đang vượt số dư")}{" "}
              {money(-totals.available)}
              {text(". Cần giảm phân bổ trước khi thêm tiền cho mục tiêu.")}
            </AlertDescription>
          </Alert>
        )}
        <StyleDivider wrapperClassName="col-span-12" />
        <div className="finance-goal-grid">
          {data.goals.map((g) => {
            const left = Math.max(0, g.target - g.allocated);
            const duration = g.monthly > 0 ? Math.ceil(left / g.monthly) : null;
            const goalTone: FinanceTone =
              g.id === "emergency" ? "balance" : "goal";
            return (
              <DashboardCard
                key={g.id}
                data-finance-surface="goal"
                className="finance-goal-card"
              >
                <div className="finance-goal-card-art">
                  <GoalCover visual={g.visual} image={g.image} alt={goalName(g)} showIcon={false} />
                </div>
                <CardHeader className="finance-goal-card-header">
                  <CardTitle>
                    <FinanceHeading>{goalName(g)}</FinanceHeading>
                  </CardTitle>
                  <CardDescription>
                    {text("Mong muốn đạt")} {date(g.deadline)}
                  </CardDescription>
                  <CardAction>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={text("Sửa mục tiêu {0}", [goalName(g)])}
                      onClick={() => setEditor(g)}
                    >
                      <Pencil />
                    </Button>
                  </CardAction>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {left === 0 && (
                    <div className="finance-goal-status flex flex-wrap gap-1.5">
                      <FinanceBadge tone="income" icon={CheckCircle2}>
                        {text("Đã đủ mục tiêu")}
                      </FinanceBadge>
                    </div>
                  )}
                  <div className="finance-goal-amount">
                    <div>
                      <p
                        data-finance-value
                        data-finance-tone={goalTone}
                        className="text-2xl font-semibold tabular-nums"
                      >
                        {money(g.allocated)}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {text("trên mục tiêu")} {money(g.target)} ·{" "}
                        {Math.round((g.allocated / g.target) * 100)}%
                      </p>
                    </div>
                    <ProgressRing
                      small
                      value={g.target ? (g.allocated / g.target) * 100 : 0}
                      label={goalName(g)}
                    />
                  </div>
                  <div className="flex flex-col gap-2 text-sm">
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground">
                        {text("Dự kiến góp / tháng")}
                      </span>
                      <span data-finance-value data-finance-tone={goalTone}>
                        {money(g.monthly)}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {left === 0
                        ? text("Số tiền đã dành đủ cho mức mục tiêu hiện tại.")
                        : duration !== null
                          ? text("Khoảng {0} tháng với mức góp hiện tại.", [
                              duration,
                            ])
                          : text(
                              "Đặt mức góp để ước tính thời gian hoàn thành.",
                            )}
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={left === 0 || !totals.balanceKnown || totals.available <= 0}
                    onClick={() => {
                      setFunding(g);
                      setAmount(
                        Math.min(
                          500_000,
                          Math.max(0, Math.min(totals.available, left)),
                        ),
                      );
                    }}
                  >
                    <Plus data-icon="inline-start" />
                    {text("Phân bổ thêm")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={text("Xóa mục tiêu {0}", [goalName(g)])}
                    onClick={() => setDeleting(g)}
                  >
                    <Trash2 />
                  </Button>
                </CardFooter>
              </DashboardCard>
            );
          })}
        </div>
        {!data.goals.length && (
          <NoResults description="Tạo mục tiêu đầu tiên để bắt đầu dành tiền." />
        )}
        <StyleDivider wrapperClassName="col-span-12" />
        <div className="finance-board-footnote flex flex-wrap items-center justify-between gap-2">
          <p className="max-w-2xl text-sm text-muted-foreground">
            {text("Tiền dành cho mục tiêu nằm trong số dư hiện có.")}
          </p>
        </div>
      </FinanceBoard>
      {editor && (
        <GoalEditor
          initial={editor === "new" ? undefined : editor}
          onClose={() => setEditor(undefined)}
        />
      )}
      {funding && (
        <Dialog
          open
          onOpenChange={(v) => {
            if (!v) setFunding(undefined);
          }}
        >
          <DialogContent size="sm" data-readable-feature data-finance-typography closeLabel={text("Đóng")}>
            {mutationError && <p role="alert">{mutationError}</p>}
            <DialogHeader>
              <DialogTitle>
                <FinanceHeading as="span">
                  {text("Phân bổ ·")} {goalName(funding)}
                </FinanceHeading>
              </DialogTitle>
              <DialogDescription>
                {text("Tối đa")} {money(fundLimit)}{" "}
                {text("từ tiền chưa phân bổ. Tổng số dư không đổi.")}
              </DialogDescription>
            </DialogHeader>
            <form
              className="flex flex-col gap-5"
              onSubmit={async (e) => {
                e.preventDefault();
                if (amount <= 0 || amount > fundLimit) return;
                try {await action('goals','PATCH',{id:funding.id,expectedRevision:funding.revision,allocated:funding.allocated+amount});}
                catch(e) {setMutationError(e instanceof Error?e.message:"Không lưu được.");return;}
                notify(
                  message("Đã dành thêm {0} cho {1}.", [
                    { money: amount },
                    { goal: funding },
                  ]),
                );
                setFunding(undefined);
              }}
            >
              <FieldGroup>
                <MoneyInput
                  id="goal-fund"
                  label={text("Số tiền phân bổ thêm (VND)")}
                  value={amount}
                  onChange={setAmount}
                  max={fundLimit}
                />
              </FieldGroup>
              <DialogFooter>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setFunding(undefined)}
                >
                  {text("Hủy")}
                </Button>
                <Button
                  type="submit"
                  disabled={busy || amount <= 0 || amount > fundLimit}
                >
                  {text("Xác nhận phân bổ")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
      {deleting && (
        <Dialog
          open
          onOpenChange={(v) => {
            if (!v) setDeleting(undefined);
          }}
        >
          <DialogContent size="sm" data-readable-feature data-finance-typography closeLabel={text("Đóng")}>
            {mutationError && <p role="alert">{mutationError}</p>}
            <DialogHeader>
              <DialogTitle>
                <FinanceHeading as="span">{text("Bỏ mục tiêu này?")}</FinanceHeading>
              </DialogTitle>
              <DialogDescription>
                {goalName(deleting)}: {money(deleting.allocated)}{" "}
                {text(
                  "sẽ trở lại tiền chưa phân bổ. Không xóa giao dịch hay số dư tài khoản.",
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleting(undefined)}>
                {text("Giữ lại")}
              </Button>
              <Button
                variant="destructive"
                disabled={busy}
                onClick={async () => {
                  try {await action('goals','DELETE',{id:deleting.id,expectedRevision:deleting.revision});} catch(e) {setMutationError(e instanceof Error?e.message:"Không lưu được.");return;}
                  notify("Đã bỏ mục tiêu và giải phóng phần phân bổ.");
                  setDeleting(undefined);
                }}
              >
                {text("Bỏ mục tiêu")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
