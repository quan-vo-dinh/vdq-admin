"use client";
import { FinanceHeading } from "./heading";
import { DateField } from "./controls";
import { useFinanceLocale } from "./locale";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  FieldGroup,
  Field,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useFinance } from "@/app/context/finance-context";
import {
  kindLabels,
  type Transaction,
  type TransactionKind,
} from "@/lib/finance/model";
import { MoneyInput, SelectField, Choice } from "./shared";

export function TransactionEditor({
  initial,
  onClose,
}: {
  initial?: Transaction;
  onClose: () => void;
}) {
  const { text } = useFinanceLocale();
  const { data, update, notify } = useFinance();
  const [kind, setKind] = useState<TransactionKind>(initial?.kind ?? "expense");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [amount, setAmount] = useState(initial?.amount ?? 0);
  const [date, setDate] = useState(initial?.date ?? data!.asOf);
  const [account, setAccount] = useState(initial?.account ?? "bank");
  const [destination, setDestination] = useState(
    initial?.destination ?? "saving",
  );
  const [category, setCategory] = useState(initial?.category ?? "food");
  const [error, setError] = useState("");
  if (!data) return null;
  const categories =
    kind === "income"
      ? [
          { value: "salary", label: text("Lương thực nhận") },
          { value: "freelance", label: text("Thu nhập khác") },
        ]
      : data.budgets.map((b) => ({ value: b.id, label: b.name }));
  const selectedCategory = categories.some((c) => c.value === category)
    ? category
    : categories[0].value;
  const accounts = data.accounts.map((a) => ({ value: a.id, label: a.name }));
  function save() {
    if (
      !description.trim() ||
      !Number.isSafeInteger(amount) ||
      amount <= 0 ||
      !date ||
      date < data!.startsOn ||
      date > data!.asOf ||
      (kind === "transfer" && account === destination)
    ) {
      setError(
        "Nhập nội dung, số tiền dương, ngày trong kỳ minh họa và hai tài khoản khác nhau khi chuyển tiền.",
      );
      return;
    }
    const row: Transaction = {
      id: initial?.id ?? crypto.randomUUID(),
      description: description.trim(),
      amount,
      date,
      account,
      kind,
      category: kind === "transfer" ? "transfer" : selectedCategory,
      destination: kind === "transfer" ? destination : undefined,
      source: "manual",
    };
    update((d) => ({
      ...d,
      transactions: initial
        ? d.transactions.map((t) => (t.id === initial.id ? row : t))
        : [...d.transactions, row],
    }));
    notify(
      initial
        ? "Đã cập nhật giao dịch trong phiên trải nghiệm."
        : "Đã thêm giao dịch. Tổng quan và ngân sách đã cập nhật.",
    );
    onClose();
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        data-readable-feature data-finance-typography
        closeLabel={text("Đóng")}
        className="max-h-[90dvh] overflow-y-auto sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle>
            <FinanceHeading as="span">
              {initial ? text("Chỉnh sửa giao dịch") : text("Ghi một giao dịch")}
            </FinanceHeading>
          </DialogTitle>
          <DialogDescription>
            {text(
              "Nhập nhanh để hiểu tiền đang đi đâu. Chỉ lưu trong phiên trải nghiệm.",
            )}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="flex flex-col gap-5"
        >
          <FieldGroup>
            <Field>
              <FieldLabel>{text("Loại giao dịch")}</FieldLabel>
              <Choice
                label={text("Loại giao dịch")}
                value={kind}
                onChange={(v) => setKind(v as TransactionKind)}
                options={Object.entries(kindLabels).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            </Field>
            <Field data-invalid={!!error}>
              <FieldLabel htmlFor="tx-description">
                {text("Nội dung")}
              </FieldLabel>
              <Input
                id="tx-description"
                value={description}
                maxLength={150}
                required
                aria-invalid={!!error}
                placeholder={text("Ví dụ: Ăn trưa văn phòng")}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>
            <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <MoneyInput
                id="tx-amount"
                label={text("Số tiền (VND)")}
                value={amount}
                onChange={setAmount}
                min={0}
              />
              <DateField
                id="tx-date"
                label="Ngày ghi nhận"
                value={date}
                onChange={setDate}
                min={data.startsOn}
                max={data.asOf}
              />
            </FieldGroup>
            <SelectField
              id="tx-account"
              label={
                kind === "transfer" ? text("Từ tài khoản") : text("Tài khoản")
              }
              value={account}
              onChange={setAccount}
              options={accounts}
            />
            {kind === "transfer" ? (
              <>
                <SelectField
                  id="tx-destination"
                  label={text("Đến tài khoản")}
                  value={destination}
                  onChange={setDestination}
                  options={accounts}
                />
                <Alert>
                  <AlertDescription>
                    {text(
                      "Chỉ thay đổi nơi giữ tiền. Không cộng vào thu nhập hoặc chi tiêu.",
                    )}
                  </AlertDescription>
                </Alert>
              </>
            ) : (
              <SelectField
                id="tx-category"
                label={text("Danh mục")}
                value={selectedCategory}
                onChange={setCategory}
                options={categories}
              />
            )}
            {error && <FieldError>{text(error)}</FieldError>}
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {text("Hủy")}
            </Button>
            <Button type="submit">
              {initial ? text("Lưu thay đổi") : text("Thêm giao dịch")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
