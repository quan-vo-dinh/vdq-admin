"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import type {
  Connection,
  ConnectionInput,
} from "@/lib/developer/connections/types";
import { validateConnection } from "@/lib/developer/connections/model";
function useConnectionState() {
  const [connections, setConnections] = useState<Connection[]>([]);
  function save(input: ConnectionInput, id?: string) {
    if (validateConnection(input)) return false;
    const now = new Date().toISOString();
    const values = {
      ...input,
      name: input.name.trim(),
      identity: input.identity.trim(),
      repositories: [...new Set(input.repositories)],
      endpoint: input.endpoint.trim(),
    };
    setConnections((previous) =>
      id
        ? previous.map((c) =>
            c.id === id
              ? { ...c, ...values, updatedAt: now, checkedAt: null }
              : c,
          )
        : [
            ...previous,
            {
              ...values,
              id: crypto.randomUUID(),
              paused: false,
              createdAt: now,
              updatedAt: now,
              checkedAt: null,
            },
          ],
    );
    return true;
  }
  function pause(id: string, paused: boolean) {
    setConnections((previous) =>
      previous.map((c) => (c.id === id ? { ...c, paused } : c)),
    );
  }
  function check(id: string) {
    setConnections((previous) =>
      previous.map((c) =>
        c.id === id ? { ...c, checkedAt: new Date().toISOString() } : c,
      ),
    );
  }
  function remove(id: string) {
    setConnections((previous) => previous.filter((c) => c.id !== id));
  }
  return { connections, save, pause, check, remove };
}
const Context = createContext<ReturnType<typeof useConnectionState> | null>(
  null,
);
export function DeveloperConnectionsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const state = useConnectionState();
  return <Context.Provider value={state}>{children}</Context.Provider>;
}
export function useDeveloperConnections() {
  const value = useContext(Context);
  if (!value) throw new Error("DeveloperConnectionsProvider missing");
  return value;
}
