"use client";

import { FinancePageHeader } from "./page-header";
import { FinanceHeading } from "./heading";
import { FinanceBoard } from "./template-layout";
import StyleDivider from "@/app/components/shared/StyleDivider";
import { SearchChoice } from "./controls";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFinanceLocale } from "./locale";
import { useState, useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Download,
  Upload,
  Search,
  Pencil,
  Trash2,
  Scale,
  CircleDollarSign,
  ReceiptText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@/components/ui/input-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { FeatureDataTable } from "@/app/components/tables/feature-data-table";
import { useFinance } from "@/app/context/finance-context";
import {
  monthlyTotals,
  kindLabels,
  type Transaction,
} from "@/lib/finance/model";
import { downloadCsv, exportTransactions } from "@/lib/finance/csv";
import {
  Metric,
  Section,
  MonthPicker,
  NoResults,
  FinanceIcon,
} from "./shared";
import { transactionIcon, transactionTone } from "./appearance";
import { TransactionEditor } from "./transaction-editor";
import { ImportDialog } from "./import-dialog";
import { inFinancePeriod, periodRange } from "@/lib/finance/period";
import { AccountSummary } from "./dashboard-widgets";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

export function TransactionsPage() {
  const { text, money, date, locale, transactionDescription } =
    useFinanceLocale();
  const { data: loaded, period, action, notify } = useFinance();
  const data = loaded!;
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [account, setAccount] = useState("all");
  const [category, setCategory] = useState("all");
  const [editor, setEditor] = useState<Transaction>();
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState<Transaction>();
  const [importing, setImporting] = useState(false);
  const stats = monthlyTotals(data.transactions, period);
  const accounts = data.accounts;
  const categories = data.categories?.map(c => ({id: c.code, name: c.name})) ?? data.budgets;
  const inScope = data.transactions
    .filter(
      (t) =>
        inFinancePeriod(t.date, period) &&
        (account === "all" ||
          t.account === account ||
          t.destination === account) &&
        (category === "all" || t.category === category) &&
        transactionDescription(t)
          .toLocaleLowerCase(locale)
          .includes(query.toLocaleLowerCase(locale)),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  const filtered = inScope.filter((t) => kind === "all" || t.kind === kind);
  const columns = useMemo<ColumnDef<Transaction>[]>(
    () => [
      {
        accessorKey: "date",
        header: text("Ngày"),
        cell: ({ getValue }) => (
          <span className="text-muted-foreground tabular-nums">
            {date(String(getValue()))}
          </span>
        ),
      },
      {
        accessorKey: "description",
        header: text("Giao dịch"),
        cell: ({ row: { original: t } }) => {
          const Icon = transactionIcon(t.kind, t.category);
          return (
            <div className="flex items-center gap-3">
              <FinanceIcon icon={Icon} tone={transactionTone[t.kind]} />
              <div className="flex min-w-40 flex-col gap-0.5">
                <span className="max-w-64 truncate font-medium">
                  {transactionDescription(t)}
                </span>
                <span className="text-sm text-muted-foreground">
                  {text(accounts.find((a) => a.id === t.account)?.name ?? "")}
                  {t.destination &&
                    ` → ${text(accounts.find((a) => a.id === t.destination)?.name ?? "")}`}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "category",
        header: text("Danh mục"),
        cell: ({ row: { original: t } }) => (
          <Badge variant="secondary">
            {text(categories.find((c) => c.id === t.category)?.name ?? "") ||
              (t.kind === "transfer" ? text("Nội bộ") : text("Thu nhập"))}
          </Badge>
        ),
      },
      {
        accessorKey: "kind",
        header: text("Loại"),
        cell: ({ row }) => text(kindLabels[row.original.kind]),
      },
      {
        accessorKey: "amount",
        header: text("Số tiền"),
        cell: ({ row: { original: t } }) => (
          <span
            data-finance-value
            data-finance-tone={transactionTone[t.kind]}
            className="whitespace-nowrap font-medium tabular-nums"
          >
            {t.kind === "transfer" ? "" : t.kind === "expense" ? "−" : "+"}
            {money(t.amount)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={text("Sửa {0}", [
                transactionDescription(row.original),
              ])}
              onClick={() => setEditor(row.original)}
            >
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={text("Xóa {0}", [
                transactionDescription(row.original),
              ])}
              onClick={() => setDeleting(row.original)}
            >
              <Trash2 />
            </Button>
          </div>
        ),
      },
    ],
    [accounts, categories, date, money, text, transactionDescription],
  );
  return (
    <div className="finance-page finance-transactions">
      <FinancePageHeader>
        <div className="flex flex-wrap gap-2">
          <MonthPicker />
          <Button variant="outline" onClick={() => setImporting(true)}>
            <Upload data-icon="inline-start" />
            {text("Nhập CSV")}
          </Button>
          <Button
            variant="outline"
            disabled={!filtered.length}
            onClick={() =>
              downloadCsv(
                `giao-dich-${typeof period === "string" ? period : `${period.from}_${period.to}`}.csv`,
                exportTransactions(filtered),
              )
            }
          >
            <Download data-icon="inline-start" />
            {text("Xuất")}
          </Button>
        </div>
      </FinancePageHeader>
      <FinanceBoard>
        <div className="finance-metrics finance-metrics-three">
          <Metric
            tone="income"
            label={text("Thu nhập đã nhận")}
            value={money(stats.income)}
            detail={text("Không tính chuyển khoản, hoàn tiền")}
            icon={CircleDollarSign}
          />
          <Metric
            tone="expense"
            label={text("Chi tiêu ròng")}
            value={money(stats.expenses)}
            detail={text("Đã trừ {0} hoàn tiền", [money(stats.refunds)])}
            icon={ReceiptText}
          />
          <Metric
            label={text("Chênh lệch thu − chi")}
            value={money(stats.net)}
            detail={text("Không phải số dư tài khoản")}
            icon={Scale}
            negative={stats.net < 0}
          />
        </div>
        <StyleDivider wrapperClassName="col-span-12" />
        <Section
          className="finance-ledger"
          title={text("Sổ giao dịch")}
          icon={ReceiptText}
          description={text(`Kỳ {0} · Dữ liệu có đến ${data.asOf}`, [
            typeof period === "string" ? period.split("-").reverse().join("/") : `${date(periodRange(period).from)} – ${date(periodRange(period).to)}`,
          ])}
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <InputGroup className="max-w-sm">
                <InputGroupAddon>
                  <Search />
                </InputGroupAddon>
                <InputGroupInput
                  aria-label={text("Tìm giao dịch")}
                  placeholder={text("Tìm nội dung giao dịch…")}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </InputGroup>
              <SearchChoice
                label="Lọc tài khoản"
                value={account}
                onChange={setAccount}
                options={[
                  { value: "all", label: "Mọi tài khoản" },
                  ...accounts.map((a) => ({ value: a.id, label: a.name })),
                ]}
              />
              <SearchChoice
                label="Lọc danh mục"
                value={category}
                onChange={setCategory}
                options={[
                  { value: "all", label: "Mọi danh mục" },
                  ...categories.map((c) => ({ value: c.id, label: c.name })),
                ]}
              />
              {(query ||
                account !== "all" ||
                category !== "all" ||
                kind !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setQuery("");
                    setAccount("all");
                    setCategory("all");
                    setKind("all");
                  }}
                >
                  {text("Xóa bộ lọc")}
                </Button>
              )}
            </div>
            <div className="overflow-x-auto">
              <Tabs value={kind} onValueChange={(v) => setKind(String(v))}>
                <TabsList
                  variant="line"
                  aria-label={text("Lọc loại giao dịch")}
                >
                  {[
                    { value: "all", label: "Tất cả" },
                    ...Object.entries(kindLabels).map(([value, label]) => ({
                      value,
                      label,
                    })),
                  ].map((item) => (
                    <TabsTrigger key={item.value} value={item.value}>
                      {text(item.label)}
                      <Badge variant="secondary">
                        {
                          inScope.filter(
                            (t) =>
                              item.value === "all" || t.kind === item.value,
                          ).length
                        }
                      </Badge>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
            <FeatureDataTable
              data={filtered}
              columns={columns}
              empty={<NoResults />}
              label={text("Sổ giao dịch tài chính")}
            />
          </div>
        </Section>
        <StyleDivider wrapperClassName="col-span-12" />
        <Accordion className="finance-notes">
          <AccordionItem value="accounts">
            <AccordionTrigger><FinanceHeading as="span">{text("Số dư tài khoản")}</FinanceHeading></AccordionTrigger>
            <AccordionContent>
              <AccountSummary />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </FinanceBoard>
      {editor && (
        <TransactionEditor
          initial={editor}
          onClose={() => setEditor(undefined)}
        />
      )}
      {importing && <ImportDialog onClose={() => setImporting(false)} />}
      {deleting && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) setDeleting(undefined);
          }}
        >
          <DialogContent size="sm" data-readable-feature data-finance-typography closeLabel={text("Đóng")}>
            <DialogHeader>
              <DialogTitle>
                <FinanceHeading as="span">{text("Xóa giao dịch này?")}</FinanceHeading>
              </DialogTitle>
              <DialogDescription>
                {transactionDescription(deleting)} · {money(deleting.amount)}
                {text(". Số dư và báo cáo sẽ được tính lại.")}
                {deleting.kind === "transfer" &&
                  text(
                    " Cả tài khoản gửi và nhận đều được hoàn lại số dư tương ứng.",
                  )}
              </DialogDescription>
            </DialogHeader>
            {deleteError && <p role="alert">{deleteError}</p>}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleting(undefined)}>
                {text("Giữ lại")}
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  try {await action('transactions','DELETE',{id:deleting.id,expectedRevision:deleting.revision});} catch(e) {setDeleteError(e instanceof Error?e.message:'Không xóa được.');return;}
                  notify("Đã xóa giao dịch.");
                  setDeleting(undefined);
                }}
              >
                {text("Xóa giao dịch")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
