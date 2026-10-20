"use client";
import { FinanceHeading } from "./heading";
import { useFinanceLocale } from "./locale";
import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Upload, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useFinance } from "@/app/context/finance-context";
import {
  csvTemplate,
  downloadCsv,
  parseFinanceCsv,
  transactionKey,
} from "@/lib/finance/csv";
import { FeatureDataTable } from "@/app/components/tables/feature-data-table";
import { NoResults } from "./shared";

type Parsed = ReturnType<typeof parseFinanceCsv>[number] & {
  duplicate: boolean;
};
export function ImportDialog({ onClose }: { onClose: () => void }) {
  const { text, money, message } = useFinanceLocale();
  const { data, update, notify } = useFinance();
  const [parsed, setParsed] = useState<ReturnType<typeof parseFinanceCsv>>([]);
  const [error, setError] = useState("");
  const [filename, setFilename] = useState("");
  const [reading, setReading] = useState(false);
  const rows = useMemo(() => {
    const keys = new Set(data!.transactions.map(transactionKey));
    return parsed.map((p) => {
      const key = transactionKey(p.row),
        duplicate = keys.has(key);
      if (!p.error) keys.add(key);
      return { ...p, duplicate };
    });
  }, [parsed, data]);
  const valid = rows.filter((r) => !r.error && !r.duplicate);
  const columns: ColumnDef<Parsed>[] = [
    { accessorKey: "line", header: text("Dòng") },
    { id: "date", header: text("Ngày"), accessorFn: (r) => r.row.date },
    {
      id: "content",
      header: text("Nội dung"),
      accessorFn: (r) => r.row.description,
    },
    {
      id: "amount",
      header: text("Số tiền"),
      cell: ({ row }) => money(row.original.row.amount || 0),
    },
    {
      id: "status",
      header: text("Kiểm tra"),
      cell: ({ row: { original: r } }) => (
        <Badge variant={r.error ? "destructive" : "outline"}>
          {text(r.error) ||
            (r.duplicate ? text("Bỏ qua · trùng") : text("Sẵn sàng"))}
        </Badge>
      ),
    },
  ];
  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent
        data-readable-feature data-finance-typography
        closeLabel={text("Đóng")}
        className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl"
      >
        <DialogHeader>
          <DialogTitle>
            <FinanceHeading as="span">{text("Nhập CSV · Xem trước rồi xác nhận")}</FinanceHeading>
          </DialogTitle>
          <DialogDescription>
            {text(
              "Chỉ hỗ trợ định dạng mẫu của bản trải nghiệm. Chưa hỗ trợ tự nhận diện sao kê ngân hàng.",
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadCsv("finance-template.csv", csvTemplate)}
          >
            <Download data-icon="inline-start" />
            {text("Tải file mẫu")}
          </Button>
          <span className="text-sm text-muted-foreground">
            {text("UTF-8 · tối đa 1 MB / 1.000 dòng")}
          </span>
        </div>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="finance-csv">
              {text("Chọn file CSV")}
            </FieldLabel>
            <Input
              id="finance-csv"
              type="file"
              accept=".csv,text/csv"
              disabled={reading}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                setParsed([]);
                setError("");
                if (!file) return;
                setFilename(file.name);
                if (file.size > 1_000_000) {
                  setError("File vượt quá 1 MB.");
                  return;
                }
                setReading(true);
                try {
                  setParsed(parseFinanceCsv(await file.text(), data!));
                } catch (err) {
                  setError(
                    err instanceof Error ? err.message : "Không đọc được file.",
                  );
                } finally {
                  setReading(false);
                }
              }}
            />
          </Field>
        </FieldGroup>
        <p className="text-sm text-muted-foreground">
          {text(
            "Ngày YYYY-MM-DD từ 01/09 đến 15/10/2026; tiền VND nguyên, dương. Mã tài khoản: bank, saving, cash. Danh mục: food, home, transport, shopping, learning, fun, other; thu nhập: salary, freelance.",
          )}
        </p>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{text(error)}</AlertDescription>
          </Alert>
        )}
        {!!rows.length && (
          <>
            <p className="text-sm">
              {filename}:{" "}
              <strong>
                {valid.length} {text("dòng mới")}
              </strong>{" "}
              · {rows.filter((r) => r.duplicate && !r.error).length}{" "}
              {text("trùng ·")} {rows.filter((r) => r.error).length}{" "}
              {text("lỗi")}
            </p>
            <FeatureDataTable
              label={text("Xem trước CSV")}
              data={rows}
              columns={columns}
              empty={<NoResults />}
            />
            <p className="text-sm text-muted-foreground">
              {text(
                "Bỏ qua dòng lỗi và dòng trùng ngày, số tiền, nội dung, loại, tài khoản. Kiểm tra kỹ các giao dịch giống nhau có thể là hai khoản riêng biệt.",
              )}
            </p>
          </>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {text("Hủy")}
          </Button>
          <Button
            disabled={!valid.length || reading}
            onClick={() => {
              update((d) => ({
                ...d,
                transactions: [
                  ...d.transactions,
                  ...valid.map((r) => ({ ...r.row, id: crypto.randomUUID() })),
                ],
              }));
              notify(
                message("Đã nhập {0} giao dịch CSV vào phiên trải nghiệm.", [
                  valid.length,
                ]),
              );
              onClose();
            }}
          >
            <Upload data-icon="inline-start" />
            {text("Nhập")} {valid.length || ""} {text("giao dịch")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
