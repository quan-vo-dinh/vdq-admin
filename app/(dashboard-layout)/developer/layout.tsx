import type { ReactNode } from "react";
import { DeveloperProvider } from "@/app/context/developer-context";
import { DeveloperShell } from "@/app/components/developer/shell";
import { DeveloperConnectionsProvider } from "@/app/context/developer-connections-context";
import { developerDemo } from "@/lib/developer/demo";
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DeveloperProvider initialData={developerDemo()}>
      <DeveloperConnectionsProvider>
        <DeveloperShell>{children}</DeveloperShell>
      </DeveloperConnectionsProvider>
    </DeveloperProvider>
  );
}
