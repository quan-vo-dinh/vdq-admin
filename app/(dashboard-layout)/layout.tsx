import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth/owner";
import { AccessError } from "@/lib/auth/policy";
import DashboardShell from "./dashboard-shell";
import DashboardSessionLoading from "@/app/components/shared/dashboard-session-loading";

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
  return <Suspense fallback={<DashboardSessionLoading />}><OwnerBoundary>{children}</OwnerBoundary></Suspense>;
}
