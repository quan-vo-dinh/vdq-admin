"use client";
import { NumberTicker } from "@/components/ui/number-ticker";

import { useMemo, useState, type ReactNode } from "react";
import { useLanguage } from "@/app/context/language-context";
import {
  createTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type PaginationState,
} from "@tanstack/react-table";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowDownUp, ChevronLeft, ChevronRight } from "lucide-react";

// Reusable typed wrapper for feature-specific columns and working row actions.
export function FeatureDataTable<T>({
  data,
  columns,
  empty,
  label,
  scrollRows = false,
}: {
  data: T[];
  columns: ColumnDef<T>[];
  empty: ReactNode;
  label: string;
  scrollRows?: boolean;
}) {
  const { t, language } = useLanguage();
  const number = (value: number) =>
    new Intl.NumberFormat(language === "vi" ? "vi-VN" : "en-GB").format(value);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 8,
  });
  // A fresh core instance per data/state snapshot avoids v8's mutable React adapter
  // retaining the same identity across renders under React Compiler.
  const table = useMemo(() => {
    const currentPagination = {
      ...pagination,
      pageIndex: Math.min(
        pagination.pageIndex,
        Math.max(0, Math.ceil(data.length / pagination.pageSize) - 1),
      ),
    };
    const instance = createTable<T>({
      data,
      columns,
      state: {},
      onStateChange: () => {},
      renderFallbackValue: null,
      onSortingChange: setSorting,
      onPaginationChange: setPagination,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getPaginationRowModel: scrollRows ? undefined : getPaginationRowModel(),
      autoResetPageIndex: false,
    });
    instance.setOptions((options) => ({
      ...options,
      state: {
        ...instance.initialState,
        sorting,
        pagination: currentPagination,
      },
    }));
    return instance;
  }, [data, columns, sorting, pagination, scrollRows]);
  if (!data.length) return empty;
  return (
    <div data-mobile-layout={scrollRows ? "scroll" : "cards"} className="feature-data-table flex min-w-0 flex-col gap-3">
      <Table aria-label={label}>
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id}>
              {group.headers.map((h) => (
                <TableHead key={h.id}>
                  {h.isPlaceholder ? null : h.column.getCanSort() ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={h.column.getToggleSortingHandler()}
                    >
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      <ArrowDownUp data-icon="inline-end" />
                      <span className="sr-only">
                        {h.column.getIsSorted() === "asc"
                          ? t("Ascending")
                          : h.column.getIsSorted() === "desc"
                            ? t("Descending")
                            : t("Sort")}
                      </span>
                    </Button>
                  ) : (
                    flexRender(h.column.columnDef.header, h.getContext())
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {typeof cell.column.columnDef.header === "string" && cell.column.columnDef.header && <span className="feature-cell-label" aria-hidden="true">{cell.column.columnDef.header}</span>}
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {!scrollRows && <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          <NumberTicker value={number(data.length)} /> {t(data.length === 1 ? "item" : "items")} ·{" "}
          {t("Page")} <NumberTicker value={number(table.getState().pagination.pageIndex + 1)} />/
          <NumberTicker value={number(table.getPageCount())} />
        </span>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={t("Previous page")}
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={t("Next page")}
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>}
    </div>
  );
}
