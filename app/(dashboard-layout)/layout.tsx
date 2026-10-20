import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth/owner";
import { AccessError } from "@/lib/auth/policy";
import DashboardShell from "./dashboard-shell";

async function OwnerBoundary({ children }: { children: React.ReactNode }) {
  // Keep request-time auth out of prerender error handling (Cache Components).
  await connection();
  try { await requireOwner(); }
  catch (error) {
    const code = error instanceof AccessError ? error.code : "auth_unavailable";
    redirect(`/auth/auth2/login?error=${code}`);
  }
  return <DashboardShell>{children}</DashboardShell>;
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div role="status" className="p-6">Checking session…</div>}><OwnerBoundary>{children}</OwnerBoundary></Suspense>;
}
