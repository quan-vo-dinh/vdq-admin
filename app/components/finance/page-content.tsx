"use client";

import type { ReactNode } from "react";
import { useFinance } from "@/app/context/finance-context";
import { FinancePageSkeleton } from "./loading";

/** Keep the router's page slot mounted; gate only the data-dependent view inside it. */
export function FinancePageContent({ children, path }: { children: ReactNode; path: string }) {
  const { data, error } = useFinance();
  if (data) return children;
  // FinanceShell already presents the request error and retry action.
  if (error) return null;
  return <FinancePageSkeleton path={path} header={false} />;
}
