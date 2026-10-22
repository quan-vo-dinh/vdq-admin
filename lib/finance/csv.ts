import { downloadTextFile } from "../platform/files";
import type { FinanceData, Transaction, TransactionKind } from "./model";
const header = [
  "date",
  "description",
  "amount",
  "kind",
  "category",
  "account",
  "destination",
];
const auditHeader = [...header, "id", "reference", "occurred_at", "reporting_role", "report_group", "cash_account", "cash_received", "funding_transaction"];
export const csvTemplate =
  "date,description,amount,kind,category,account,destination\n2026-10-15,Bua trua,55000,expense,food,bank,\n2026-10-14,Chuyen tien,100000,transfer,transfer,bank,saving\n";
export const transactionKey = (t: Transaction) =>
  [
    t.date,
    t.description.trim().toLocaleLowerCase("vi"),
    t.amount,
    t.kind,
    t.account,
    t.destination ?? "",
  ].join("|");
export const sameImportedTransaction = (a: Transaction, b: Transaction) =>
  a.account === b.account && ((a.reference && b.reference)
    ? a.reference === b.reference
    : transactionKey(a) === transactionKey(b));
export function importDuplicates(rows: Transaction[], existing: Transaction[]) {
  const seen = [...existing];
  return rows.map(row => {const duplicate = seen.some(t => sameImportedTransaction(t, row)); seen.push(row); return duplicate;});
}
export const categoryCodePattern = /^[a-z][a-z0-9_-]{0,39}$/;

// Demo snapshots predate persisted categories; production always provides them.
export function financeCategories(data: FinanceData) {
  return data.categories ?? [
    ...data.budgets.map(b => ({code: b.id, name: b.name, kind: "expense", archived_at: b.archivedAt})),
    {code: "salary", name: "Lương thực nhận", kind: "income", archived_at: null},
    {code: "freelance", name: "Thu nhập khác", kind: "income", archived_at: null},
  ];
}

export function parseFinanceCsv(text: string, data: FinanceData) {
  // RFC4180-style quoted fields, escaped quotes, CRLF and embedded newlines.
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false;
  const input = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (c === '"') {
      if (quoted && input[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if (c === "\n" && !quoted) {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (quoted) throw new Error("Dấu ngoặc kép trong CSV chưa được đóng.");
  if (cell || row.length) {
    row.push(cell.replace(/\r$/, ""));
    rows.push(row);
  }
  const titles = rows.shift()?.map((v) => v.trim());
  const audited = titles?.join(",") === auditHeader.join(",");
  if (!titles || (!audited && titles.join(",") !== header.join(",")))
    throw new Error(
      "Dùng CSV 7 cột cơ bản hoặc CSV đầy đủ xuất từ Finance (giữ nguyên tiêu đề cột).",
    );
  const records = rows.filter((r) => r.some((v) => v.trim()));
  if (!records.length || records.length > 1000)
    throw new Error("File cần có từ 1 đến 1.000 giao dịch.");
  const categories = new Map(financeCategories(data).map(c => [c.code, c]));
  const parsed = records.map((cells, i) => {
    const [date, description, raw, kind, category, account, destination = "", sourceId, reference, occurredAt, role, group, cashAccount, cashReceived, fundingTransaction] =
      cells.map((v) => {const text=v.trim();return audited&&/^'(?:[=+@\-\t\r]|')/.test(text)?text.slice(1):text;});
    const amount = Number(raw);
    const row: Transaction = {
      id: sourceId || `csv-${i}`,
      date,
      description,
      amount,
      kind: kind as TransactionKind,
      category,
      account,
      destination: kind === "transfer" ? destination : undefined,
      source: "csv",
      reference: reference || undefined,
      occurredAt: occurredAt || undefined,
      reportingRole: (role || "standard") as Transaction["reportingRole"],
      reportGroup: group || undefined,
      cashAccount: cashAccount || undefined,
      cashReceived: Number(cashReceived || 0),
      fundingTransaction: fundingTransaction || undefined,
    };
    let error = "";
    if (
      cells.length !== (audited ? auditHeader.length : header.length) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(Date.parse(date)) ||
      new Date(date).toISOString().slice(0, 10) !== date ||
      date > data.asOf
    )
      error = "Ngày hoặc số cột không hợp lệ";
    else if (
      !description ||
      description.length > 150 ||
      !Number.isSafeInteger(amount) ||
      amount <= 0 ||
      amount > 1_000_000_000
    )
      error = "Kiểm tra nội dung / số tiền VND";
    else if (
      !["income", "expense", "transfer", "refund"].includes(kind) ||
      !data.accounts.some((a) => a.id === account && !a.archivedAt)
    )
      error = "Loại hoặc tài khoản không hợp lệ";
    else if (
      kind === "transfer" &&
      (account === destination ||
        !data.accounts.some((a) => a.id === destination && !a.archivedAt))
    )
      error = "Tài khoản nhận không hợp lệ";
    if (!error && kind !== "transfer") {
      const existing = categories.get(category);
      if (!categoryCodePattern.test(category) || category === "transfer")
        error = "Mã danh mục cần 1–40 ký tự: chữ thường, số, _ hoặc -; bắt đầu bằng chữ, không dùng transfer.";
      else if (existing?.archived_at)
        error = "Danh mục đã lưu trữ.";
    }
    if (!error && (reference?.length > 120 || group?.length > 80 ||
      !["standard","support_return","cash_withdrawal","prepaid_cash"].includes(role || "standard") ||
      (occurredAt && (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(occurredAt) || !Number.isFinite(Date.parse(occurredAt)) || new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Ho_Chi_Minh",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(occurredAt)) !== date)) ||
      (role === "support_return" && (kind !== "expense" || !group)) ||
      (role === "cash_withdrawal" && (kind !== "expense" || cashAccount === account || !data.accounts.some(a => a.id === cashAccount && !a.archivedAt) || !Number.isSafeInteger(row.cashReceived) || !row.cashReceived || row.cashReceived > amount)) ||
      (role === "prepaid_cash" && (kind !== "expense" || !fundingTransaction)) ||
      (role !== "cash_withdrawal" && (!!cashAccount || !!row.cashReceived)) ||
      (role !== "prepaid_cash" && !!fundingTransaction))) error = "Kiểm tra tham chiếu, thời điểm hoặc quy tắc tiền mặt / hoàn hỗ trợ.";
    return { row, error, line: i + 2, newCategory: !error && kind !== "transfer" && !categories.has(category) };
  });
  const ids = new Set<string>();
  for (const p of parsed) {if(ids.has(p.row.id)) p.error = "Mã dòng CSV bị trùng."; ids.add(p.row.id);}
  return parsed;
}
export function downloadCsv(filename: string, text: string) {
  downloadTextFile(filename, "\uFEFF" + text, "text/csv;charset=utf-8");
}
export function exportTransactions(rows: Transaction[]) {
  const escape = (value: string | number) => {
    const text = String(value);
    return `"${(/^[=+@\-\t\r']/.test(text) ? "'" + text : text).replace(/"/g, '""')}"`;
  };
  return [
    auditHeader.join(","),
    ...rows.map((t) =>
      [
        t.date,
        t.description,
        t.amount,
        t.kind,
        t.category,
        t.account,
        t.destination ?? "",
        t.id,
        t.reference ?? "",
        t.occurredAt ?? "",
        t.reportingRole ?? "standard",
        t.reportGroup ?? "",
        t.cashAccount ?? "",
        t.cashReceived ?? 0,
        t.fundingTransaction ?? "",
      ]
        .map(escape)
        .join(","),
    ),
  ].join("\n");
}
