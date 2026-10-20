"use client";
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
}: {
  rows: Session[];
}) {
  const { text, number } = useDeveloperLocale();
  const groups = modelUsage(rows);
  type Row = (typeof groups)[number];
  const columns: ColumnDef<Row>[] = [
    {
      accessorKey: "model",
      header: "Model",
      cell: (c) => {
        const m = modelCatalog.find((m) => m.id === c.row.original.model);
        return (
          <div className="flex flex-col gap-1">
            <ProviderTitle provider={m?.provider ?? "Codex"}>
              {modelName(c.row.original.model)}
            </ProviderTitle>
            <span className="text-xs text-muted-foreground">
              {c.row.original.model}
            </span>
          </div>
        );
      },
    },
    { accessorKey: "sessions", header: text("Phiên", "Sessions") },
    ...(["input", "output", "cache", "total"] as const).map((key) => ({
      accessorKey: key,
      header: key === "total" ? text("Tổng token", "Total tokens") : key,
      cell: (c: { row: { original: Row } }) => number(c.row.original[key]),
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
          <span className="text-xs text-muted-foreground">
            {c.row.original.timedSessions}/{c.row.original.sessions}{" "}
            {text("phiên có thời gian", "timed sessions")}
          </span>
        </div>
      ),
    },
  ];
  return (
    <Panel
      className="shadow-none ring-0"
      title={text("Sử dụng theo model", "Usage by model")}
      description={text(
        "Output tok/s = tổng output ÷ thời gian sinh của các phiên có timing; không tính tool/wait.",
        "Output tok/s = total output ÷ generation time of timed sessions; excludes tool/wait.",
      )}

    >
      <FeatureDataTable
        data={groups}
        columns={columns}
        empty={<NoResults />}
        label={text("Sử dụng theo model", "Model usage")}
      />
    </Panel>
  );
}
