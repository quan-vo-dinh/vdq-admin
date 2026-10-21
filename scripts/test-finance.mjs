import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
import { test } from "node:test";

const temporary = mkdtempSync(join(tmpdir(), "finance-unit-"));
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
      ...["model", "demo", "csv", "i18n", "messages", "wire"].map(
        (name) => `lib/finance/${name}.ts`,
      ),
    ],
    { stdio: "inherit" },
  );
  const require = createRequire(import.meta.url);
  const {
    overview,
    monthlyTotals,
    accountBalance,
    categorySpent,
    forecast,
    budgetLimit,
  } = require(join(temporary, "finance/model.js"));
  const {financeWire,financeNumbers}=require(join(temporary,"finance/wire.js"));
  const { financeDemo } = require(join(temporary, "finance/demo.js"));
  const {
    csvTemplate,
    parseFinanceCsv,
    exportTransactions,
    transactionKey,
  } = require(join(temporary, "finance/csv.js"));
  const data = financeDemo();
  const { createFinanceLocale } = require(join(temporary, "finance/i18n.js"));
  const { financeEnglish } = require(join(temporary, "finance/messages.js"));
  test("VI/EN formatting keeps VND values and interpolated notices consistent", () => {
    const vi = createFinanceLocale("vi"),
      en = createFinanceLocale("en");
    assert.equal(vi.compactMoney(2_500_000), "2,5 tr");
    assert.equal(en.compactMoney(2_500_000), "2.5 m");
    assert.match(en.money(-3_570_000), /3,570,000/);
    assert.match(vi.money(-3_570_000), /3\.570\.000/);
    const message = vi.message("Đã dành thêm {0} cho {1}.", [
      { money: 500_000 },
      { goal: data.goals[0] },
    ]);
    assert.match(vi.formatMessage(message), /Quỹ dự phòng/);
    assert.match(en.formatMessage(message), /Emergency fund/);
    assert.match(en.formatMessage(message), /500,000/);
    assert.equal(
      en.text("Ngày hoặc số cột không hợp lệ"),
      "Invalid date or column count",
    );
    assert.equal(en.date("2026-10-20", { month: "short" }), "Oct");
  });
  test("localized demo labels do not translate user content or mutate financial data", () => {
    const en = createFinanceLocale("en");
    const original = JSON.stringify(data);
    assert.equal(en.goalName(data.goals[0]), "Emergency fund");
    assert.equal(
      en.goalName({ ...data.goals[0], name: "Mục tiêu riêng của tôi" }),
      "Mục tiêu riêng của tôi",
    );
    assert.equal(
      en.goalName({ ...data.goals[0], id: "user-created" }),
      "Quỹ dự phòng",
    );
    assert.equal(
      en.transactionDescription({ ...data.transactions[0], source: "manual" }),
      data.transactions[0].description,
    );
    assert.equal(
      en.transactionDescription({ ...data.transactions[0], source: "csv" }),
      data.transactions[0].description,
    );
    assert.notEqual(
      en.transactionDescription(data.transactions[0]),
      data.transactions[0].description,
    );
    data.accounts.forEach((a) => en.text(a.name));
    data.budgets.forEach((b) => en.text(b.name));
    assert.equal(JSON.stringify(data), original);
    const exported = exportTransactions(data.transactions);
    en.money(overview(data).balance);
    assert.equal(exportTransactions(data.transactions), exported);
    assert.equal(
      parseFinanceCsv(exported, data).filter((r) => r.error).length,
      0,
    );
  });
  test("all English messages retain their interpolation placeholders", () => {
    const placeholders = (s) =>
      [...s.matchAll(/\{\d+\}/g)].map((m) => m[0]).sort();
    for (const [key, translation] of Object.entries(financeEnglish)) {
      assert.ok(translation.trim(), key);
      assert.deepEqual(placeholders(translation), placeholders(key), key);
    }
  });
  test("internal transfer changes both accounts and preserves total balance and income/expense", () => {
    const without = {
      ...data,
      transactions: data.transactions.filter((t) => t.kind !== "transfer"),
    };
    assert.equal(overview(data).balance, overview(without).balance);
    assert.deepEqual(
      monthlyTotals(data.transactions, "2026-10"),
      monthlyTotals(without.transactions, "2026-10"),
    );
    assert.equal(
      accountBalance(data.accounts[0], data.transactions),
      accountBalance(data.accounts[0], without.transactions) - 2_000_000,
    );
    assert.equal(
      accountBalance(data.accounts[1], data.transactions),
      accountBalance(data.accounts[1], without.transactions) + 2_000_000,
    );
  });
  test("refund reduces its category expense and never inflates income", () => {
    assert.equal(
      categorySpent(data.transactions, "shopping", "2026-10"),
      1_100_000,
    );
    assert.deepEqual(monthlyTotals(data.transactions, "2026-10"), {
      income: 2_500_000,
      expenses: 6_070_000,
      refunds: 150_000,
      net: -3_570_000,
    });
  });
  test("goal allocation reduces available funds without changing cash or expenses", () => {
    const before = overview(data);
    const after = overview({
      ...data,
      goals: data.goals.map((g, i) =>
        i === 0 ? { ...g, allocated: g.allocated + 500_000 } : g,
      ),
    });
    assert.equal(before.balance, 29_270_000);
    assert.equal(before.available, 4_320_000);
    assert.equal(after.balance, before.balance);
    assert.equal(after.available, before.available - 500_000);
  });
  test("monthly budget adjustment does not modify another month", () => {
    const b = { ...data.budgets[0], monthlyLimits: { "2026-10": 3_000_000 } };
    assert.equal(budgetLimit(b, "2026-10"), 3_000_000);
    assert.equal(budgetLimit(b, "2026-09"), 2_000_000);
  });
  const inputs = {
    income: 12_000_000,
    expenses: 6_000_000,
    shock: 0,
    reserve: 22_000_000,
    salaryDay: 25,
  };
  test("forecast pays salary only on declared dates and applies each bill once", () => {
    const chart = forecast(data.asOf, 10_000_000, 60, inputs, data.bills);
    const base = forecast(data.asOf, 10_000_000, 60, inputs);
    assert.equal(chart.length, 61);
    assert.equal(chart[0].date, "2026-10-15");
    assert.equal(chart[1].date, "2026-10-16");
    assert.equal(chart.at(-1).date, "2026-12-14");
    assert.equal(
      chart.reduce((s, r) => s + r.income, 0),
      24_000_000,
    );
    assert.equal(base.at(-1).balance - chart.at(-1).balance, 2_950_000);
  });
  test("forecast shock occurs once on day seven and allows negative balances", () => {
    const a = forecast(data.asOf, 0, 30, {
      ...inputs,
      income: 0,
      shock: 1_000_000,
    });
    const b = forecast(data.asOf, 0, 30, { ...inputs, income: 0 });
    assert.equal(a[6].balance, b[6].balance);
    assert.equal(a[7].balance, b[7].balance - 1_000_000);
    assert.equal(a.at(-1).balance, -7_000_000);
    assert.ok(a.every((r) => Number.isSafeInteger(r.balance)));
  });
  test("CSV template and exports round trip quotes, commas, Unicode and newlines", () => {
    assert.equal(
      parseFinanceCsv(csvTemplate, data).filter((p) => !p.error).length,
      2,
    );
    const original = {
      ...data.transactions[0],
      description: 'Ăn, uống "cùng bạn"\nngày nghỉ',
    };
    const parsed = parseFinanceCsv(exportTransactions([original]), data);
    assert.equal(parsed[0].error, "");
    assert.equal(parsed[0].row.description, original.description);
    assert.equal(transactionKey(parsed[0].row), transactionKey(original));
  });
  test("CSV rejects impossible dates, invalid transfers, fractional or excessive VND and invalid category codes", () => {
    const header = csvTemplate.split("\n")[0];
    for (const line of [
      "2026-09-31,bad,100,expense,food,bank,",
      "2026-10-30,future,100,expense,food,bank,",
      "2026-10-14,same account,100,transfer,transfer,bank,bank",
      "2026-10-14,fraction,100.5,expense,food,bank,",
      "2026-10-14,too large,1000000001,expense,food,bank,",
      "2026-10-14,category,100,expense,Invalid Code,bank,",
    ])
      assert.ok(parseFinanceCsv(`${header}\n${line}`, data)[0].error, line);
    assert.throws(() => parseFinanceCsv("bad,header\n1,2", data));
    assert.throws(() => parseFinanceCsv(`${header}\n\"unclosed`, data));
  });
  test("CSV discovers new expense/refund and income categories without mutating data", () => {
    const before = JSON.stringify(data);
    const rows = parseFinanceCsv(`${csvTemplate.split("\n")[0]}\n2026-10-14,Doctor,100,expense,suc_khoe,bank,\n2026-10-14,Refund,50,refund,suc_khoe,bank,\n2026-10-14,Bonus,500,income,thuong,bank,`, data);
    assert.ok(rows.every(r => !r.error && r.newCategory));
    assert.deepEqual([...new Set(rows.map(r => r.row.category))], ["suc_khoe", "thuong"]);
    assert.equal(JSON.stringify(data), before);
  });
  test("CSV checks persisted category kind, archival, conflicting new kinds and archived accounts", () => {
    const snapshot = {...data, categories: [
      {id:"1", code:"custom", name:"Custom", kind:"income", archived_at:null, revision:1},
      {id:"2", code:"old", name:"Old", kind:"expense", archived_at:"2026-10-01", revision:1},
    ]};
    const parse = (lines, input = snapshot) => parseFinanceCsv(`${csvTemplate.split("\n")[0]}\n${lines}`, input);
    assert.equal(parse("2026-10-14,Bonus,500,income,custom,bank,")[0].error, "");
    assert.equal(parse("2026-10-14,Bonus,500,income,custom,bank,")[0].newCategory, false);
    for (const [kind,code] of [["expense","custom"],["refund","old"],["income","transfer"],["income",""],["expense","a".repeat(41)]])
      assert.ok(parse(`2026-10-14,Invalid,100,${kind},${code},bank,`)[0].error);
    assert.ok(parse("2026-10-14,A,100,income,new_code,bank,\n2026-10-14,B,100,expense,new_code,bank,").every(r => r.error));
    assert.ok(parse("2026-10-14,A,100,expense,new_code,bank,", {...snapshot,accounts:data.accounts.map(a=>({...a,archivedAt:"2026-10-01"}))})[0].error);
  });
  test("CSV permits backfilled transactions before the original reporting start", () => {
    const header = csvTemplate.split("\n")[0];
    const row = parseFinanceCsv(`${header}\n2025-12-15,Backfilled expense,100,expense,food,bank,`, data)[0];
    assert.equal(row.error, "");
    assert.equal(row.row.date, "2025-12-15");
  });
  test("CSV export defuses spreadsheet formulas", () => {
    const text = exportTransactions([
      { ...data.transactions[0], description: "=1+1" },
    ]);
    assert.ok(text.includes('"\'=1+1"'));
  });
  test("money DTO text round-trip and unsafe UI rejection", () => {
    const sample={accounts:[{opening:-1000000}],transactions:[{amount:1000000000}],budgets:[{limit:100,monthlyLimits:{"2026-10":200}}],goals:[{target:300,allocated:100,monthly:20}]};
    const wire=financeWire(sample);
    assert.equal(wire.accounts[0].opening,"-1000000");assert.equal(wire.budgets[0].monthlyLimits["2026-10"],"200");
    assert.deepEqual(financeNumbers(wire),sample);
    assert.throws(()=>financeNumbers({amount:"999999999999999999"}));assert.throws(()=>financeNumbers({amount:"1.1"}));
  });
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
