import type { ConnectionInput } from "./types";
import { connectionDefinition } from "./catalog";
export function validateConnection(
  input: ConnectionInput,
): "name" | "identity" | "repositories" | "endpoint" | "capabilities" | null {
  if (!input.name.trim() || input.name.length > 80) return "name";
  if (!input.identity.trim() || input.identity.length > 160) return "identity";
  if (
    input.kind === "github-repo" &&
    (!input.repositories.length ||
      input.repositories.length > 50 ||
      input.repositories.some(
        (r) => !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(r),
      ))
  )
    return "repositories";
  if (input.kind === "claude-telemetry") {
    try {
      if (/\s/.test(input.endpoint)) return "endpoint";
      const url = new URL(input.endpoint);
      if (
        !["http:", "https:"].includes(url.protocol) ||
        url.username ||
        url.password ||
        url.search ||
        url.hash
      )
        return "endpoint";
      if (
        url.protocol === "http:" &&
        !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
      )
        return "endpoint";
    } catch {
      return "endpoint";
    }
  }
  const allowed = connectionDefinition(input.kind).capabilities.map(
    (c) => c.id,
  );
  if (
    !input.capabilities.length ||
    input.capabilities.some((c) => !allowed.includes(c))
  )
    return "capabilities";
  return null;
}
export function telemetryConfig(endpoint: string) {
  return `CLAUDE_CODE_ENABLE_TELEMETRY=1\nOTEL_METRICS_EXPORTER=otlp\nOTEL_LOGS_EXPORTER=none\nOTEL_TRACES_EXPORTER=none\nOTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf\nOTEL_EXPORTER_OTLP_ENDPOINT=${endpoint}\nOTEL_LOG_USER_PROMPTS=0\nOTEL_LOG_ASSISTANT_RESPONSES=0\nOTEL_LOG_RAW_API_BODIES=0`;
}

export function requestedPermissions(
  input: Pick<ConnectionInput, "kind" | "capabilities">,
) {
  const definition = connectionDefinition(input.kind);
  if (input.kind !== "github-repo") return definition.permissions;
  return [
    "Metadata: read",
    ...(input.capabilities.some((c) => c === "commits" || c === "contributions")
      ? ["Contents: read"]
      : []),
    ...(input.capabilities.includes("prs") ? ["Pull requests: read"] : []),
  ];
}
