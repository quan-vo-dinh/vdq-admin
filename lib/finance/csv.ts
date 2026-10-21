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
  if (!titles || titles.join(",") !== header.join(","))
    throw new Error(
      "Dùng đúng 7 cột trong file CSV: date,description,amount,kind,category,account,destination.",
    );
  const records = rows.filter((r) => r.some((v) => v.trim()));
  if (!records.length || records.length > 1000)
    throw new Error("File cần có từ 1 đến 1.000 giao dịch.");
  const categories = new Map(financeCategories(data).map(c => [c.code, c]));
  const parsed = records.map((cells, i) => {
    const [date, description, raw, kind, category, account, destination = ""] =
      cells.map((v) => v.trim());
    const amount = Number(raw);
    const row: Transaction = {
      id: `csv-${i}`,
      date,
      description,
      amount,
      kind: kind as TransactionKind,
      category,
      account,
      destination: kind === "transfer" ? destination : undefined,
      source: "csv",
    };
    let error = "";
    if (
      cells.length !== 7 ||
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
    return { row, error, line: i + 2, newCategory: !error && kind !== "transfer" && !categories.has(category) };
  });
  return parsed;
}
export function downloadCsv(filename: string, text: string) {
  downloadTextFile(filename, "\uFEFF" + text, "text/csv;charset=utf-8");
}
export function exportTransactions(rows: Transaction[]) {
  const escape = (value: string | number) => {
    const text = String(value);
    return `"${(/^[=+@\-\t\r]/.test(text) ? "'" + text : text).replace(/"/g, '""')}"`;
  };
  return [
    header.join(","),
    ...rows.map((t) =>
      [
        t.date,
        t.description,
        t.amount,
        t.kind,
        t.category,
        t.account,
        t.destination ?? "",
      ]
        .map(escape)
        .join(","),
    ),
  ].join("\n");
}
