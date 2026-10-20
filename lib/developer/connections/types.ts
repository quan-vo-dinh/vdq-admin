export type Copy = readonly [string, string];
export type ConnectionKind =
  | "github-repo"
  | "github-inbox"
  | "codex"
  | "openai-api"
  | "chatgpt-workspace"
  | "claude-telemetry"
  | "claude-api"
  | "claude-code-org"
  | "claude-enterprise";
export type PendingStatus =
  "authorization" | "credential" | "device" | "telemetry";
export type Connection = {
  id: string;
  kind: ConnectionKind;
  name: string;
  group: "personal" | "work";
  identity: string;
  repositories: string[];
  endpoint: string;
  capabilities: string[];
  paused: boolean;
  createdAt: string;
  updatedAt: string;
  checkedAt: string | null;
};
export type ConnectionInput = Pick<
  Connection,
  | "kind"
  | "name"
  | "group"
  | "identity"
  | "repositories"
  | "endpoint"
  | "capabilities"
>;
export type ConnectionDefinition = {
  kind: ConnectionKind;
  family: "GitHub" | "OpenAI" | "Claude";
  title: string;
  description: Copy;
  method: Copy;
  identityLabel: Copy;
  identityHint: Copy;
  permissions: string[];
  capabilities: { id: string; label: Copy }[];
  pending: PendingStatus;
  next: Copy;
  docs: string;
};
