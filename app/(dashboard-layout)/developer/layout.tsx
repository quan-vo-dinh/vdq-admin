import { connection } from "next/server";
import type { ReactNode } from "react";
import { DeveloperProvider } from "@/app/context/developer-context";
import { DeveloperShell } from "@/app/components/developer/shell";
import { emptyDeveloperData } from "@/lib/developer/live/types";
export default async function Layout({ children }: { children: ReactNode }) {
  await connection();
  return (
    <DeveloperProvider initialData={emptyDeveloperData()}>
        <DeveloperShell>{children}</DeveloperShell>
    </DeveloperProvider>
  );
}
