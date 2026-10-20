import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
import { test } from "node:test";
const temporary = mkdtempSync(join(tmpdir(), "developer-unit-"));
try {
  execFileSync(
    "pnpm",
    [
      "exec",
      "tsc",
      "--ignoreConfig",
      "--target",
      "es2022",
      "--module",
      "commonjs",
      "--skipLibCheck",
      "--outDir",
      temporary,
      "lib/developer/model.ts",
      "lib/developer/models.ts",
      "lib/developer/demo.ts",
    ],
    { stdio: "inherit" },
  );
  const require = createRequire(import.meta.url);
  const { developerDemo } = require(join(temporary, "demo.js"));
  const { modelCatalog } = require(join(temporary, "models.js"));
  const {
    startDate,
    selectSessions,
    selectContributions,
    modelUsage,
    tokens,
    trend,
    reportText,
  } = require(join(temporary, "model.js"));
  const data = developerDemo();
  test("time filters include both snapshot and start boundaries", () => {
    assert.equal(startDate(1), "2026-10-16");
    assert.equal(startDate(7), "2026-10-10");
    assert.equal(startDate(30), "2026-09-17");
    assert(selectSessions(data, 1).every((s) => s.date === "2026-10-16"));
    assert.equal(selectContributions(data, 7).length, 14);
    assert.equal(selectContributions(data, 1, "github-work").length, 1);
  });
  test("model/account/provider filters intersect and all latest reference models have demo observations", () => {
    for (const model of modelCatalog) {
      const rows = selectSessions(data, 30, "all", model.provider, model.id);
      assert(rows.length > 0, model.id);
      assert(
        rows.every(
          (s) => s.model === model.id && s.date >= model.availableFrom,
        ),
      );
    }
    assert.equal(
      selectSessions(data, 30, "codex-work", "Claude Code").length,
      0,
    );
    assert(
      selectSessions(data, 7, "codex-work", "Codex", "gpt-6.1-sol").every(
        (s) => s.sourceId === "codex-work" && s.model === "gpt-6.1-sol",
      ),
    );
  });
  test("provider and model totals reconcile with source sessions", () => {
    const rows = selectSessions(data, 30);
    assert.equal(
      modelUsage(rows).reduce((n, m) => n + m.total, 0),
      tokens(rows),
    );
    assert.equal(
      trend(rows).reduce((n, day) => n + day.Codex + day.Claude, 0),
      tokens(rows),
    );
    assert.equal(modelUsage([]).length, 0);
  });
  test("throughput is weighted by generation seconds and excludes missing timings", () => {
    const base = data.sessions[0];
    const result = modelUsage([
      { ...base, output: 100, generationSeconds: 10 },
      { ...base, output: 100, generationSeconds: 2 },
      { ...base, output: 9000, generationSeconds: null },
    ])[0];
    assert.equal(result.throughput, 200 / 12);
    assert.equal(result.timedSessions, 2);
    assert.equal(result.sessions, 3);
    assert.equal(
      modelUsage([{ ...base, generationSeconds: null }])[0].throughput,
      null,
    );
  });
  test("combined contributions equal account totals without deduplication claims", () => {
    const sum = (rows) => rows.reduce((n, r) => n + r.count, 0);
    assert.equal(
      sum(selectContributions(data, 30)),
      sum(selectContributions(data, 30, "github-work")) +
        sum(selectContributions(data, 30, "github-personal")),
    );
    assert.equal(new Set(data.contributions.map((d) => d.date)).size, 289);
  });
  test("unknown quota remains null and stale work observation stays stale", () => {
    assert.equal(data.sources.find((s) => s.id === "claude-demo").quota, null);
    assert.equal(
      data.sources.find((s) => s.id === "codex-work").status,
      "stale",
    );
    assert(
      data.sources.every(
        (s) => s.quota === null || (s.quota >= 0 && s.quota <= 100),
      ),
    );
  });
  test("reports reflect current inbox state, chosen period and coverage limitations", () => {
    assert.match(reportText(data, 7, "vi"), /2026-10-10/);
    const read = {
      ...data,
      notifications: data.notifications.map((n) => ({ ...n, read: true })),
    };
    assert.match(reportText(read, 1, "en"), /0 unread/);
    assert.match(reportText(data, 30, "en"), /fictional/);
    assert.match(reportText(data, 30, "vi"), /Không cộng quota/);
  });
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
