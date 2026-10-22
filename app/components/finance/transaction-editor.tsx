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
import { financeCategories } from "@/lib/finance/csv";
import { MoneyInput, SelectField, Choice } from "./shared";

export function TransactionEditor({
  initial,
  onClose,
}: {
  initial?: Transaction;
  onClose: () => void;
}) {
  const { text } = useFinanceLocale();
  const { data, action, busy, notify } = useFinance();
  const [createId] = useState(() => crypto.randomUUID());
  const [kind, setKind] = useState<TransactionKind>(initial?.kind ?? "expense");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [amount, setAmount] = useState(initial?.amount ?? 0);
  const [date, setDate] = useState(initial?.date ?? data!.asOf);
  const [account, setAccount] = useState(initial?.account ?? data?.accounts.find(a=>!a.archivedAt)?.id ?? "");
  const [destination, setDestination] = useState(
    initial?.destination ?? data?.accounts.filter(a=>!a.archivedAt)[1]?.id ?? "",
  );
  const [category, setCategory] = useState(initial?.category ?? "food");
  const [reference,setReference]=useState(initial?.reference??"");
  const [occurredAt,setOccurredAt]=useState(initial?.occurredAt?new Date(Date.parse(initial.occurredAt)+7*3600000).toISOString().slice(0,19):"");
  const [role,setRole]=useState<Transaction["reportingRole"]>(initial?.reportingRole??"standard");
  const [group,setGroup]=useState(initial?.reportGroup??"");
  const [cashAccount,setCashAccount]=useState(initial?.cashAccount??"");
  const [cashReceived,setCashReceived]=useState(initial?.cashReceived??0);
  const [funding,setFunding]=useState(initial?.fundingTransaction??"");
  const [error, setError] = useState("");
  if (!data) return null;
  const categories = financeCategories(data)
    .filter(c => !c.archived_at || c.code === initial?.category)
    .map(c => ({value: c.code, label: c.name}));
  const selectedCategory = categories.some((c) => c.value === category)
    ? category
    : categories[0]?.value ?? "";
  const accounts = data.accounts.filter(a=>!a.archivedAt || a.id===initial?.account).map((a) => ({ value: a.id, label: a.name }));
  async function save() {
    if (
      !description.trim() ||
      !Number.isSafeInteger(amount) ||
      amount <= 0 ||
      !date ||
      date > data!.asOf ||
      (kind === "transfer" && account === destination)
    ) {
      setError(
        "Nhập nội dung, số tiền dương, ngày không sau hôm nay và hai tài khoản khác nhau khi chuyển tiền.",
      );
      return;
    }
    if ((role==="support_return"&&!group.trim())||(role==="cash_withdrawal"&&(!cashAccount||cashAccount===account||cashReceived<=0||cashReceived>amount))||(role==="prepaid_cash"&&!funding)) {setError("Kiểm tra nhóm hoàn hỗ trợ, tài khoản tiền mặt và số tiền nhận / nguồn ATM.");return;}
    const timestamp=occurredAt?`${occurredAt.length===16?occurredAt+":00":occurredAt}+07:00`:null;
    if(timestamp&&occurredAt.slice(0,10)!==date){setError("Thời điểm phải cùng ngày ghi nhận, theo giờ Việt Nam.");return;}
    const row: Transaction = {
      id: initial?.id ?? createId,
      description: description.trim(),
      amount,
      date,
      account,
      kind,
      category: kind === "transfer" ? "transfer" : selectedCategory,
      destination: kind === "transfer" ? destination : undefined,
      source: "manual",
    };
    try {
      await action('transactions', initial ? 'PATCH' : 'POST', {
        id: row.id, expectedRevision: initial?.revision, date, description: row.description,
        amount, kind, account_id: account, destination_account_id: row.destination ?? null,
        category_id: kind === 'transfer' ? null : data!.categories?.find(c=>c.code===selectedCategory)?.id,
        source: initial?.source==='csv'?'csv':'manual', reference:reference.trim()||null, occurred_at:timestamp, reporting_role:role,report_group:group.trim()||null,cash_account_id:role==='cash_withdrawal'?cashAccount:null,cash_received:role==='cash_withdrawal'?cashReceived:0,funding_transaction_id:role==='prepaid_cash'?funding:null,
      });
    } catch (e) { setError(e instanceof Error ? e.message : 'Không lưu được.'); return; }
    notify(
      initial
        ? "Đã cập nhật giao dịch."
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
      <DialogContent size="md"
        data-readable-feature data-finance-typography
        closeLabel={text("Đóng")}
        className="max-h-[90dvh] overflow-y-auto "
      >
        <DialogHeader>
          <DialogTitle>
            <FinanceHeading as="span">
              {initial ? text("Chỉnh sửa giao dịch") : text("Ghi một giao dịch")}
            </FinanceHeading>
          </DialogTitle>
          <DialogDescription>
            {text(
              "Nhập nhanh để hiểu tiền đang đi đâu.",
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
                onChange={(v) => {setKind(v as TransactionKind);setRole("standard");}}
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
            <Field><FieldLabel htmlFor="tx-reference">Mã tham chiếu ngân hàng</FieldLabel><Input id="tx-reference" value={reference} maxLength={120} onChange={e=>setReference(e.target.value)}/></Field>
            <Field><FieldLabel htmlFor="tx-time">Thời điểm chứng từ (giờ Việt Nam, nếu có)</FieldLabel><Input id="tx-time" type="datetime-local" step="1" value={occurredAt} onChange={e=>setOccurredAt(e.target.value)}/></Field>
            <Field><FieldLabel htmlFor="tx-group">Nhóm liên quan (ví dụ: lương tháng, chuyến đi)</FieldLabel><Input id="tx-group" maxLength={80} value={group} onChange={e=>setGroup(e.target.value)}/></Field>
            {kind==="expense"&&<SelectField id="tx-reporting-role" label="Cách tính báo cáo" value={role??"standard"} onChange={v=>setRole(v as Transaction["reportingRole"])} options={[{value:"standard",label:"Chi tiêu thông thường"},{value:"support_return",label:"Trả lại tiền hỗ trợ (giảm thu nhập)"},{value:"cash_withdrawal",label:"Rút ATM tính vào ngân sách, còn nhận tiền mặt"},{value:"prepaid_cash",label:"Chi tiền mặt đã tính vào ngân sách tại ATM"}]}/>}
            {role==="cash_withdrawal"&&<><SelectField id="tx-cash-account" label="Nhận về tài khoản tiền mặt" value={cashAccount} onChange={setCashAccount} options={accounts.filter(a=>a.value!==account)}/><MoneyInput id="tx-cash-received" label="Tiền mặt thực nhận (VND)" value={cashReceived} onChange={setCashReceived} min={0}/><p className="text-sm text-muted-foreground">Toàn bộ tiền trừ ngân hàng tính chi theo danh mục đã chọn. Tiền mặt nhận về vẫn nằm trong tài sản; chi từ khoản này cần liên kết nguồn ATM để không tính ngân sách lần hai.</p></>}
            {role==="prepaid_cash"&&<><SelectField id="tx-funding" label="Khoản ATM đã tính ngân sách" value={funding} onChange={setFunding} options={data.transactions.filter(t=>t.reportingRole==="cash_withdrawal"&&t.cashAccount===account&&t.date<=date).map(t=>({value:t.id,label:`${t.date} · ${t.description}`}))}/><p className="text-sm text-muted-foreground">Chỉ giảm tiền mặt còn giữ. Không cộng chi ngân sách lần nữa. Chỉ chọn khi đã xác nhận tiền này thuộc khoản ATM đã chọn.</p></>}
            {error && <FieldError>{text(error)}</FieldError>}
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {text("Hủy")}
            </Button>
            <Button type="submit" disabled={busy || !accounts.length}>
              {initial ? text("Lưu thay đổi") : text("Thêm giao dịch")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
