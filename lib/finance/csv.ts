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
  return records.map((cells, i) => {
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
      !data.accounts.some((a) => a.id === account)
    )
      error = "Loại hoặc tài khoản không hợp lệ";
    else if (
      kind === "transfer" &&
      (account === destination ||
        !data.accounts.some((a) => a.id === destination))
    )
      error = "Tài khoản nhận không hợp lệ";
    else if (
      (kind === "expense" || kind === "refund") &&
      !data.budgets.some((b) => b.id === category)
    )
      error = "Danh mục không hợp lệ";
    return { row, error, line: i + 2 };
  });
}
export function downloadCsv(filename: string, text: string) {
  const url = URL.createObjectURL(
    new Blob(["\uFEFF", text], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
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
