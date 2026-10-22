"use client";
import { toast } from "@/components/ui/toast";
import { useLanguage } from "@/app/context/language-context";
import { createContext, useContext, useState, type ReactNode } from "react";
import type {
  Connection,
  ConnectionInput,
} from "@/lib/developer/connections/types";
import { validateConnection } from "@/lib/developer/connections/model";
function useConnectionState() {
  const { language } = useLanguage();
  const message = (vi: string, en: string, type = "success") => toast.add({title: language === "vi" ? vi : en, type});
  const [connections, setConnections] = useState<Connection[]>([]);
  function save(input: ConnectionInput, id?: string) {
    if (validateConnection(input)) {message("Thông tin kết nối chưa hợp lệ.", "Invalid connection details.", "error");return false;}
    if (id && !connections.some(c => c.id === id)) return false;
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
    message(id ? "Đã sửa kết nối trong phiên hiện tại." : "Đã thêm kết nối trong phiên hiện tại.", id ? "Connection updated for this session." : "Connection added for this session.");
    return true;
  }
  function pause(id: string, paused: boolean) {
    if (!connections.some(c => c.id === id)) return;
    setConnections((previous) =>
      previous.map((c) => (c.id === id ? { ...c, paused } : c)),
    );
    message(paused ? "Đã tạm dừng kết nối trong phiên." : "Đã bật lại kết nối trong phiên.", paused ? "Connection paused for this session." : "Connection resumed for this session.");
  }
  function check(id: string) {
    setConnections((previous) =>
      previous.map((c) =>
        c.id === id ? { ...c, checkedAt: new Date().toISOString() } : c,
      ),
    );
  }
  function remove(id: string) {
    if (!connections.some(c => c.id === id)) return;
    setConnections((previous) => previous.filter((c) => c.id !== id));
    message("Đã xóa kết nối khỏi phiên hiện tại.", "Connection removed from this session.");
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
