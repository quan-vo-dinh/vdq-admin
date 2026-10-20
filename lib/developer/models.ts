import type { Provider } from "./model";
// Official catalog verified for the requested snapshot, not an account entitlement list.
export const modelCatalog: {
  id: string;
  name: string;
  provider: Exclude<Provider, "GitHub">;
  availableFrom: string;
  reference: string;
}[] = [
  {
    id: "gpt-6.1-sol",
    name: "GPT-6.1 Sol",
    provider: "Codex",
    availableFrom: "2026-09-29",
    reference: "https://developers.openai.com/api/docs/models/gpt-6.1-sol",
  },
  {
    id: "gpt-6-astra",
    name: "GPT-6 Astra",
    provider: "Codex",
    availableFrom: "2026-09-03",
    reference: "https://learn.chatgpt.com/docs/models",
  },
  {
    id: "gpt-6-luna",
    name: "GPT-6 Luna",
    provider: "Codex",
    availableFrom: "2026-09-17",
    reference: "https://learn.chatgpt.com/docs/models",
  },
  {
    id: "gpt-6-sol",
    name: "GPT-6 Sol",
    provider: "Codex",
    availableFrom: "2026-09-17",
    reference: "https://learn.chatgpt.com/docs/models",
  },
  {
    id: "claude-haiku-5-5",
    name: "Claude Haiku 5.5",
    provider: "Claude Code",
    availableFrom: "2026-10-07",
    reference: "https://www.anthropic.com/claude-haiku-5-5",
  },
  {
    id: "claude-sonnet-5-5",
    name: "Claude Sonnet 5.5",
    provider: "Claude Code",
    availableFrom: "2026-09-28",
    reference: "https://www.anthropic.com/claude-sonnet-5-5",
  },
  {
    id: "claude-opus-5-5",
    name: "Claude Opus 5.5",
    provider: "Claude Code",
    availableFrom: "2026-09-22",
    reference: "https://www.anthropic.com/claude-opus-5-5",
  },
  {
    id: "claude-fable-5-1",
    name: "Claude Fable 5.1",
    provider: "Claude Code",
    availableFrom: "2026-09-01",
    reference: "https://www.anthropic.com/claude-fable-and-mythos-5-1",
  },
];
export const modelName = (id: string) =>
  modelCatalog.find((m) => m.id === id)?.name ?? id;
