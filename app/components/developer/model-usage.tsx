"use client";
import { NumberTicker } from "@/components/ui/number-ticker";
import type { ColumnDef } from "@tanstack/react-table";
import { FeatureDataTable } from "@/app/components/tables/feature-data-table";
import {
  modelUsage,
  type Session,
} from "@/lib/developer/model";
import { modelCatalog, modelName } from "@/lib/developer/models";
import { Panel, NoResults, useDeveloperLocale } from "./shared";
import { ProviderTitle } from "./brand-icon";
export function ModelUsage({
  rows,
  accounts = [],
}: {
  rows: Session[];
  accounts?: {id:string;name:string;identity:string|null;total:number|null}[];
}) {
  const { text, number } = useDeveloperLocale();
  type Row = {model:string;accountName?:string;identity?:string|null;sessions:number|null;input:number|null;output:number|null;cache:number|null;total:number|null;throughput:number|null;timedSessions:number|null};
  const accountMode = accounts.length > 0;
  const groups:Row[] = accountMode ? accounts.map(account=>({model:account.id,accountName:account.name,identity:account.identity,sessions:null,input:null,output:null,cache:null,total:account.total,throughput:null,timedSessions:null})) : modelUsage(rows);
  const columns: ColumnDef<Row>[] = [
    {
      accessorKey: "model",
      header: accountMode ? text("Tài khoản", "Account") : "Model",
      cell: (c) => {
        const m = modelCatalog.find((m) => m.id === c.row.original.model);
        return (
          <div className="flex flex-col gap-1">
            <ProviderTitle provider={m?.provider ?? "Codex"}>
              {c.row.original.accountName ?? modelName(c.row.original.model)}
            </ProviderTitle>
            <span className="text-xs text-muted-foreground">
              {c.row.original.identity ?? (accountMode ? "—" : c.row.original.model)}
            </span>
          </div>
        );
      },
    },
    { accessorKey: "sessions", header: text("Phiên", "Sessions"), cell:c=>c.row.original.sessions === null ? "—" : <NumberTicker value={c.row.original.sessions} /> },
    ...(["input", "output", "cache", "total"] as const).map((key) => ({
      accessorKey: key,
      header: key === "total" ? text("Tổng token", "Total tokens") : key,
      cell: (c: { row: { original: Row } }) => c.row.original[key] === null ? "—" : <NumberTicker value={c.row.original[key]} />,
    })),
    {
      accessorKey: "throughput",
      header: "Output tok/s",
      cell: (c) => (
        <div className="flex flex-col gap-1">
          <span>
            {c.row.original.throughput === null
              ? "—"
              : number(c.row.original.throughput)}
          </span>
          {c.row.original.timedSessions !== null && <span className="text-xs text-muted-foreground">
            {c.row.original.timedSessions}/{c.row.original.sessions}{" "}
            {text("phiên có thời gian", "timed sessions")}
          </span>}
        </div>
      ),
    },
  ];
  return (
    <Panel
      className="shadow-none ring-0"
      title={accountMode ? text("Sử dụng theo tài khoản", "Usage by account") : text("Sử dụng theo model", "Usage by model")}
      description={accountMode ? text("Tổng token theo ngày từ Codex. Nguồn chưa cung cấp model, số phiên, Input/Output/Cache và tốc độ nên các cột này hiển thị —.","Daily token totals from Codex. Model, sessions, Input/Output/Cache and throughput are unavailable and shown as —.") : text(
        "Output tok/s = tổng output ÷ thời gian sinh của các phiên có timing; không tính tool/wait.",
        "Output tok/s = total output ÷ generation time of timed sessions; excludes tool/wait.",
      )}

    >
      <FeatureDataTable
        data={groups}
        columns={columns}
        empty={<NoResults />}
        label={accountMode ? text("Sử dụng theo tài khoản", "Account usage") : text("Sử dụng theo model", "Model usage")}
      />
    </Panel>
  );
}
