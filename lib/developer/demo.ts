import { SNAPSHOT, type DeveloperData } from "./model";
import { modelCatalog } from "./models";
export function developerDemo(): DeveloperData {
  const sources: DeveloperData["sources"] = [
    {
      id: "codex-personal",
      subscription: { plan: "Plus", fiveHourRemaining: 28, weeklyRemaining: 46 },
      name: "Codex · Personal",
      provider: "Codex",
      scope: "personal",
      status: "fresh",
      observedAt: "2026-10-16T08:55:00+07:00",
      detail: "Demo · subscription · local observation",
      quota: 72,
      window: "5h",
      resetsAt: "2026-10-16T12:00:00+07:00",
    },
    {
      id: "codex-work",
      subscription: { plan: "Pro", fiveHourRemaining: 9, weeklyRemaining: 18 },
      name: "Codex · Work",
      provider: "Codex",
      scope: "work",
      status: "stale",
      observedAt: "2026-10-15T18:00:00+07:00",
      detail: "Demo · subscription · stale snapshot",
      quota: 91,
      window: "5h",
      resetsAt: "2026-10-15T21:00:00+07:00",
    },
    {
      id: "claude-demo",
      subscription: { plan: "Max", fiveHourRemaining: 56, weeklyRemaining: 67 },
      name: "Claude Code · Demo",
      provider: "Claude Code",
      scope: "unconfirmed",
      status: "partial",
      observedAt: "2026-10-16T08:40:00+07:00",
      detail: "Demo · local sessions only · account unconfirmed",
      quota: null,
      window: null,
      resetsAt: null,
    },
    {
      id: "github-personal",
      name: "GitHub · Personal",
      provider: "GitHub",
      scope: "personal",
      status: "fresh",
      observedAt: "2026-10-16T08:50:00+07:00",
      detail: "Demo · public activity",
      quota: null,
      window: null,
      resetsAt: null,
    },
    {
      id: "github-work",
      name: "GitHub · Work",
      provider: "GitHub",
      scope: "work",
      status: "partial",
      observedAt: "2026-10-16T08:30:00+07:00",
      detail: "Demo · private repository coverage incomplete",
      quota: null,
      window: null,
      resetsAt: null,
    },
  ];
  // Stable per-day noise keeps the fixture varied without changing on reload.
  const sample = (day: number, salt: number) => {
    let value = Math.imul(day + 1, 374761393) ^ Math.imul(salt + 1, 668265263);
    value = Math.imul(value ^ (value >>> 13), 1274126177);
    return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
  };
  const sessions: DeveloperData["sessions"] = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(Date.parse(`${SNAPSHOT}T00:00:00Z`) - i * 86400000)
      .toISOString()
      .slice(0, 10);
    for (let account = 0; account < 3; account++) {
      if ((i + account) % 13 === 0) continue;
      const available = modelCatalog.filter(
        (m) =>
          m.provider === sources[account].provider && m.availableFrom <= date,
      );
      // Independent daily workloads: quiet days, typical use, and occasional peaks.
      const tokenMultiplier = sources[account].provider === "Codex" ? 64 : 24;
      const dailyLoad = 12 + Math.pow(sample(29 - i, 40 + account), 1.8) * 150;
      for (let index = 0; index < available.length; index++) {
        const model = available[index];
        const scale = dailyLoad * (0.45 + sample(29 - i, 50 + account * 10 + index) * 1.1);
        const output = Math.round((2000 + scale * 120) * tokenMultiplier);
        sessions.push({
          id: `${date}-${account}-${model.id}`,
          date,
          sourceId: sources[account].id,
          model: model.id,
          input: Math.round((8000 + scale * 850) * tokenMultiplier),
          output,
          cache: Math.round((5000 + scale * 360) * tokenMultiplier),
          generationSeconds:
            (i + index) % 7 === 0
              ? null
              : Math.round(output / (35 + index * 18 + account * 6)),
        });
      }
    }
  }
  const contributions: DeveloperData["contributions"] = [];
  for (let i = 0; i < 289; i++) {
    const date = new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10);
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
    const weekend = weekday === 0 || weekday === 6;
    const breakDay = (i >= 42 && i <= 47) || (i >= 118 && i <= 122) || (i >= 207 && i <= 213);
    const dayOff = breakDay || sample(i, 0) < (weekend ? 0.62 : 0.15);
    // A mix of quiet weeks and concentrated development sprints.
    const sprint = Math.floor(i / 11) % 5;
    for (let a = 0; a < 2; a++) {
      const active = !dayOff && sample(i, a + 1) > (a === 1 && weekend ? 0.88 : 0.18);
      const intensity = sample(i, 5 + a);
      const ceiling = sprint === 0 ? 5 : sprint === 3 ? 36 : intensity < 0.5 ? 12 : 24;
      const commits = active ? 1 + Math.floor(sample(i, 9 + a) * ceiling) : 0;
      const prs = active && sample(i, 13 + a) > 0.68 ? 1 + Math.floor(sample(i, 17 + a) * 3) : 0;
      const issues = active && sample(i, 21 + a) > 0.85 ? 1 : 0;
      const reviews = active && sample(i, 25 + a) > 0.55 ? 1 + Math.floor(sample(i, 29 + a) * (a ? 6 : 3)) : 0;
      contributions.push({
        date,
        sourceId: a ? "github-work" : "github-personal",
        commits,
        prs,
        issues,
        reviews,
        count: commits + prs + issues + reviews,
      });
    }
  }
  const notifications: DeveloperData["notifications"] = Array.from(
    { length: 12 },
    (_, i) => ({
      id: `notice-${i}`,
      date: `2026-10-${String(16 - Math.floor(i / 3)).padStart(2, "0")}`,
      sourceId: i % 2 ? "github-personal" : "github-work",
      repo: i % 2 ? "shadcn-ui/ui" : "vercel/next.js",
      title: [
        "Review requested · navigation accessibility",
        "Mention · chart tooltip behavior",
        "Assigned · improve loading state",
        "Review requested · responsive inbox filters",
        "Mention · model usage breakdown",
        "Assigned · keyboard navigation in dialog",
        "Review requested · contribution calendar contrast",
        "Mention · token formatting for large values",
        "Assigned · empty state localization",
        "Review requested · source freshness indicator",
        "Mention · pagination after marking read",
        "Assigned · mobile chart layout",
      ][i % 12],
      kind: (["review", "mention", "assigned"] as const)[i % 3],
      read: i > 7,
      url:
        i % 2
          ? "https://github.com/shadcn-ui/ui/pulls"
          : "https://github.com/vercel/next.js/pulls",
      body: "Fictional notification for this UI demo. The source link opens the public repository pull-request list; no corresponding issue or PR is claimed.",
    }),
  );
  return {
    snapshot: "2026-10-16T09:00:00+07:00",
    sources,
    sessions,
    contributions,
    notifications,
  };
}
