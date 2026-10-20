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
  const { data, action, busy, notify } = useFinance();
  const [batchId, setBatchId] = useState(() => crypto.randomUUID());
  const [csv, setCsv] = useState("");
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
  const valid = rows.filter((r) => !r.error);
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
            (r.duplicate ? text("Cảnh báo · giống giao dịch khác") : text("Sẵn sàng"))}
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
      <DialogContent size="xl"
        data-readable-feature data-finance-typography
        closeLabel={text("Đóng")}
        className="max-h-[90dvh] overflow-y-auto "
      >
        <DialogHeader>
          <DialogTitle>
            <FinanceHeading as="span">{text("Nhập CSV · Xem trước rồi xác nhận")}</FinanceHeading>
          </DialogTitle>
          <DialogDescription>
            {text(
              "Chỉ hỗ trợ định dạng CSV được cung cấp. Chưa hỗ trợ tự nhận diện sao kê ngân hàng.",
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadCsv("finance-template.csv", `date,description,amount,kind,category,account,destination\n${data!.asOf},Bua trua,55000,expense,food,${data!.accounts.find(a=>!a.archivedAt)?.id??'TAO_TAI_KHOAN_TRUOC'},\n`)}
          >
            <Download data-icon="inline-start" />
            {text("Tải định dạng CSV")}
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
                  const content = await file.text(); setCsv(content); setBatchId(crypto.randomUUID());
                  setParsed(parseFinanceCsv(content, data!));
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
            `Ngày YYYY-MM-DD từ ${data!.startsOn} đến ${data!.asOf}; VND nguyên dương, tối đa 1 tỷ. Mã tài khoản: ${data!.accounts.map(a=>a.id).join(', ')}. Danh mục: ${data!.budgets.map(b=>b.id).join(', ')}, salary, freelance.`,
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
                "Một dòng lỗi sẽ chặn toàn bộ lượt nhập. Dòng giống nhau chỉ là cảnh báo; cả hai vẫn được nhập.",
              )}
            </p>
          </>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {text("Hủy")}
          </Button>
          <Button
            disabled={!valid.length || reading || busy || rows.some(r=>r.error)}
            onClick={async () => {
              try { await action('import', 'POST', {id: batchId, csv}); }
              catch(e) {setError(e instanceof Error ? e.message : 'Không nhập được.'); return;}
              notify(
                message("Đã nhập {0} giao dịch CSV.", [
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
