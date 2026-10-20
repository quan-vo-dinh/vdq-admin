import type { ConnectionDefinition } from "./types";
export const connectionCatalog: ConnectionDefinition[] = [
  {
    kind: "github-repo",
    family: "GitHub",
    title: "GitHub repositories",
    description: [
      "Commit, PR, lịch đóng góp và số dòng code thay đổi.",
      "Commits, PRs, contribution calendar and code changes.",
    ],
    method: ["GitHub App · quyền đọc", "GitHub App · read access"],
    identityLabel: ["Tài khoản GitHub", "GitHub account"],
    identityHint: [
      "Tên đăng nhập, ví dụ vodinhquan. Cấp quyền repository riêng ở GitHub.",
      "Login, e.g. octocat. Repository access is granted separately on GitHub.",
    ],
    permissions: ["Metadata: read", "Contents: read", "Pull requests: read"],
    capabilities: [
      { id: "contributions", label: ["Lịch đóng góp", "Contributions"] },
      {
        id: "commits",
        label: ["Commit và dòng thêm/xóa", "Commits and code changes"],
      },
      { id: "prs", label: ["Pull requests", "Pull requests"] },
    ],
    pending: "authorization",
    next: [
      "Cần GitHub cấp quyền cho app và xác nhận repository được truy cập. Inbox cần một kết nối riêng.",
      "GitHub must authorize the app and confirm repository access. Inbox requires a separate connection.",
    ],
    docs: "https://docs.github.com/en/apps/creating-github-apps",
  },
  {
    kind: "github-inbox",
    family: "GitHub",
    title: "GitHub Inbox",
    description: [
      "Thông báo, yêu cầu review và trạng thái đã đọc.",
      "Notifications, review requests and read state.",
    ],
    method: ["PAT classic · notifications", "Classic PAT · notifications"],
    identityLabel: ["Tài khoản GitHub", "GitHub account"],
    identityHint: [
      "Không dùng token của GitHub App cho Notifications API.",
      "GitHub App tokens do not support the Notifications API.",
    ],
    permissions: ["notifications"],
    capabilities: [
      {
        id: "notifications",
        label: ["Thông báo cá nhân", "Personal notifications"],
      },
    ],
    pending: "credential",
    next: [
      "Cần credential PAT classic có scope notifications. Chưa cấp quyền đọc nội dung repository private.",
      "Requires a classic PAT with notifications scope. This does not grant private repository content access.",
    ],
    docs: "https://docs.github.com/en/rest/activity/notifications",
  },
  {
    kind: "codex",
    family: "OpenAI",
    title: "Codex · ChatGPT",
    description: [
      "Theo dõi tài khoản, quota và usage qua máy chạy Codex.",
      "Account, quota and usage through a computer running Codex.",
    ],
    method: [
      "Codex App Server · đăng nhập ChatGPT",
      "Codex App Server · ChatGPT sign-in",
    ],
    identityLabel: ["Tên máy / profile", "Computer / profile name"],
    identityHint: [
      "Mỗi danh tính dùng một profile riêng, ví dụ MacBook · Personal.",
      "Use a separate profile per identity, e.g. MacBook · Personal.",
    ],
    permissions: [
      "Account metadata",
      "Rate limits",
      "Available usage summaries",
    ],
    capabilities: [
      {
        id: "quota",
        label: ["Quota và thời điểm reset", "Quota and reset time"],
      },
      {
        id: "usage",
        label: [
          "Token theo ngày khi có dữ liệu",
          "Daily tokens when available",
        ],
      },
    ],
    pending: "device",
    next: [
      "Cần companion trên máy chạy Codex và hoàn thành đăng nhập ChatGPT ở máy đó. Dữ liệu chưa được cung cấp sẽ để trống.",
      "Requires a companion on the Codex computer and ChatGPT sign-in there. Unavailable fields remain empty.",
    ],
    docs: "https://learn.chatgpt.com/docs/app-server",
  },
  {
    kind: "openai-api",
    family: "OpenAI",
    title: "OpenAI API organization",
    description: [
      "Usage và chi phí của API theo organization/project.",
      "API usage and costs by organization/project.",
    ],
    method: ["Credential quản trị API", "API administration credential"],
    identityLabel: ["Organization ID", "Organization ID"],
    identityHint: [
      "Organization trên OpenAI Platform; tách biệt gói ChatGPT.",
      "An OpenAI Platform organization, separate from the ChatGPT subscription.",
    ],
    permissions: ["Organization usage: read", "Organization costs: read"],
    capabilities: [
      {
        id: "api-usage",
        label: ["Token và số request API", "API tokens and requests"],
      },
      { id: "api-cost", label: ["Chi phí API", "API costs"] },
    ],
    pending: "credential",
    next: [
      "Cần credential có quyền đọc báo cáo. Key gọi model không tự chứng minh quyền đọc usage/cost.",
      "A reporting credential is required. Model API access does not establish usage/cost access.",
    ],
    docs: "https://developers.openai.com/api/reference/administration/overview",
  },
  {
    kind: "chatgpt-workspace",
    family: "OpenAI",
    title: "ChatGPT workspace",
    description: [
      "Báo cáo hoạt động tổng hợp của workspace đủ điều kiện.",
      "Aggregated activity for eligible workspaces.",
    ],
    method: [
      "Workspace Admin / Analytics API",
      "Workspace Admin / Analytics API",
    ],
    identityLabel: ["Workspace ID", "Workspace ID"],
    identityHint: [
      "Cần workspace và quyền quản trị phù hợp; không dùng API key gọi model.",
      "Requires an eligible workspace and administrative access, not a model API key.",
    ],
    permissions: ["enterprise.analytics.usage.read"],
    capabilities: [
      {
        id: "workspace-analytics",
        label: ["Usage tổng hợp theo workspace", "Aggregated workspace usage"],
      },
    ],
    pending: "credential",
    next: [
      "Cần endpoint được bật cho workspace và credential đúng scope; không tự mở dữ liệu ChatGPT cá nhân.",
      "Requires an enabled workspace endpoint and correct scope; it does not expose personal ChatGPT data.",
    ],
    docs: "https://learn.chatgpt.com/docs/enterprise/analytics-api",
  },
  {
    kind: "claude-telemetry",
    family: "Claude",
    title: "Claude Code · telemetry",
    description: [
      "Session, token, code changes và chi phí ước tính từ máy.",
      "Sessions, tokens, code changes and estimated cost from a computer.",
    ],
    method: [
      "OpenTelemetry → OTLP collector",
      "OpenTelemetry → OTLP collector",
    ],
    identityLabel: ["Tên máy / môi trường", "Computer / environment name"],
    identityHint: [
      "Chỉ thu dữ liệu từ các môi trường đã bật gửi telemetry.",
      "Covers only environments configured to export telemetry.",
    ],
    permissions: ["Metrics only", "No prompt or response content"],
    capabilities: [
      { id: "sessions", label: ["Session và token", "Sessions and tokens"] },
      {
        id: "edits",
        label: ["Code thêm/xóa, commit, PR", "Code changes, commits, PRs"],
      },
      { id: "estimated-cost", label: ["Chi phí ước tính", "Estimated cost"] },
    ],
    pending: "telemetry",
    next: [
      "Cần collector và sự kiện đầu tiên. Không có quota Pro/Max từ telemetry; không thu prompt hay nội dung code.",
      "Requires a collector and the first event. Telemetry does not provide Pro/Max quota; no prompts or code content are collected.",
    ],
    docs: "https://code.claude.com/docs/en/monitoring-usage",
  },
  {
    kind: "claude-api",
    family: "Claude",
    title: "Claude Platform API",
    description: [
      "Báo cáo token và chi phí API organization.",
      "Organization API token and cost reports.",
    ],
    method: ["Platform Admin API", "Platform Admin API"],
    identityLabel: ["Organization ID", "Organization ID"],
    identityHint: [
      "Dùng tổ chức trên Claude Platform; không phải đăng nhập Claude.ai Pro/Max.",
      "A Claude Platform organization, not Claude.ai Pro/Max sign-in.",
    ],
    permissions: ["Organization usage reports", "Organization cost reports"],
    capabilities: [
      { id: "api-usage", label: ["API usage", "API usage"] },
      { id: "api-cost", label: ["API costs", "API costs"] },
    ],
    pending: "credential",
    next: [
      "Cần Admin/reporting credential của organization. API này không dành cho individual accounts.",
      "Requires organization Admin/reporting credentials. The Admin API is unavailable for individual accounts.",
    ],
    docs: "https://platform.claude.com/docs/en/manage-claude/usage-cost-api",
  },
  {
    kind: "claude-code-org",
    family: "Claude",
    title: "Claude Code · organization",
    description: [
      "Báo cáo theo ngày cho user và model trong tổ chức.",
      "Daily reporting by user and model for an organization.",
    ],
    method: [
      "Claude Code Analytics Admin API",
      "Claude Code Analytics Admin API",
    ],
    identityLabel: ["Organization ID", "Organization ID"],
    identityHint: [
      "Phạm vi organization có Admin API; báo cáo tổng hợp có độ trễ.",
      "An organization with Admin API access; aggregates have a reporting delay.",
    ],
    permissions: ["Claude Code analytics reports"],
    capabilities: [
      {
        id: "code-analytics",
        label: ["Session, code, tool actions", "Sessions, code, tool actions"],
      },
      {
        id: "model-usage",
        label: [
          "Token / estimated cost theo model",
          "Tokens / estimated cost by model",
        ],
      },
    ],
    pending: "credential",
    next: [
      "Cần credential quản trị tổ chức; chỉ số theo ngày không phải realtime.",
      "Requires organization reporting credentials; daily aggregates are not real-time.",
    ],
    docs: "https://platform.claude.com/docs/en/manage-claude/claude-code-analytics-api",
  },
  {
    kind: "claude-enterprise",
    family: "Claude",
    title: "Claude Enterprise",
    description: [
      "Engagement và usage theo phạm vi Enterprise.",
      "Engagement and usage within an Enterprise organization.",
    ],
    method: ["Enterprise Analytics key", "Enterprise Analytics key"],
    identityLabel: ["Organization ID", "Organization ID"],
    identityHint: [
      "Analytics key được quản lý trong claude.ai, khác Platform Admin key.",
      "Analytics keys are managed in claude.ai, distinct from Platform Admin keys.",
    ],
    permissions: ["read:analytics"],
    capabilities: [
      {
        id: "engagement",
        label: ["Engagement tổng hợp", "Aggregated engagement"],
      },
      {
        id: "enterprise-usage",
        label: [
          "Usage/cost khi plan hỗ trợ",
          "Usage/cost where supported by the plan",
        ],
      },
    ],
    pending: "credential",
    next: [
      "Cần Analytics key do primary owner cấp và xác minh capability theo plan.",
      "Requires an Analytics key from the primary owner and plan-specific capability verification.",
    ],
    docs: "https://platform.claude.com/docs/en/manage-claude/analytics-api",
  },
];
export function connectionDefinition(kind: ConnectionDefinition["kind"]) {
  return connectionCatalog.find((item) => item.kind === kind)!;
}
