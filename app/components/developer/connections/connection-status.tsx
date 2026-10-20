"use client";
import { Badge } from "@/components/ui/badge";
import type {
  Connection,
  Copy,
  PendingStatus,
} from "@/lib/developer/connections/types";
import { connectionDefinition } from "@/lib/developer/connections/catalog";
import { useConnectionsLocale } from "./locale";
const status: Record<PendingStatus, Copy> = {
  authorization: ["Chờ cấp quyền", "Awaiting authorization"],
  credential: ["Chờ credential", "Awaiting credential"],
  device: ["Chờ máy kết nối", "Awaiting computer"],
  telemetry: ["Chờ dữ liệu đầu tiên", "Awaiting first data"],
};
export function ConnectionStatus({ connection }: { connection: Connection }) {
  const { text, copy } = useConnectionsLocale();
  return (
    <Badge variant="outline">
      {connection.paused
        ? text("Đã tạm dừng", "Paused")
        : copy(status[connectionDefinition(connection.kind).pending])}
    </Badge>
  );
}
