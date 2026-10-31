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
      ...["model", "demo", "csv", "i18n", "messages", "wire", "reconciliation"].map(
        (name) => `lib/finance/${name}.ts`,
      ),
    ],
    { stdio: "inherit" },
  );
  const require = createRequire(import.meta.url);
  const { dailySpendingComparison } = require(join(temporary, "finance/model.js"));
  test("planned salary and spending stay in the ledger without changing current balances or actual reports", () => {
    const { splitTransactions, ledgerTransactions, unusualExpenses } = require(join(temporary, "finance/model.js"));
    const rows = [
      { id: "today", date: "2026-10-31", amount: 100, kind: "expense", account: "bank", category: "food" },
      { id: "salary", date: "2026-11-01", amount: 10000, kind: "income", account: "bank", category: "salary" },
      { id: "planned-spend", date: "2026-11-02", amount: 200, kind: "expense", account: "bank", category: "food" },
    ];
    const split = splitTransactions(rows, "2026-10-31");
    assert.equal(split.transactions.length, 1);
    assert.equal(split.scheduledTransactions.length, 2);
    const data = { asOf: "2026-10-31", startsOn: "2026-10-01", accounts: [{ id: "bank", name: "Bank", opening: 1000, openingOn: "2026-10-01" }], budgets: [], goals: [], bills: [], ...split };
    assert.equal(ledgerTransactions(data).length, 3);
    assert.equal(accountPosition(data, data.accounts[0]).balance, 900);
    assert.equal(monthlyTotals(data.transactions, "2026-11").income, 0);
    assert.equal(unusualExpenses(data, "2026-11").length, 0);
    const nextDay = { ...data, asOf: "2026-11-01", ...splitTransactions(rows, "2026-11-01") };
    assert.equal(accountPosition(nextDay, nextDay.accounts[0]).balance, 10900);
    assert.equal(monthlyTotals(nextDay.transactions, "2026-11").income, 10000);
    assert.equal(nextDay.scheduledTransactions.length, 1);
    const { financeNumbers, financeWire } = require(join(temporary, "finance/wire.js"));
    assert.deepEqual(financeNumbers(financeWire(data)), data);
  });
  test("unusual expenses need sufficient prior category history and ignore planned entries and transfers", () => {
    const { unusualExpenses } = require(join(temporary, "finance/model.js"));
    const history = [1, 2, 3, 4, 5].map(day => ({ id: String(day), date: `2026-10-0${day}`, amount: 100, kind: "expense", category: "food" }));
    const high = { id: "high", date: "2026-10-06", amount: 201, kind: "expense", category: "food" };
    const data = { asOf: "2026-10-06", transactions: [...history, high, { ...high, id: "transfer", kind: "transfer" }, { ...high, id: "future", date: "2026-10-07" }] };
    assert.deepEqual(unusualExpenses(data, "2026-10").map(row => row.id), ["high"]);
    assert.equal(unusualExpenses({ ...data, transactions: [...history.slice(1), high] }, "2026-10").length, 0);
  });
  test("daily spending compares calendar days to their monthly budget without future actuals", () => {
    const data = {
      asOf: "2024-02-02",
      budgets: [{ id: "food", limit: 3100, monthlyLimits: { "2024-02": 2900 } }],
      transactions: [
        { date: "2024-02-01", amount: 150, kind: "expense" },
        { date: "2024-02-01", amount: 20, kind: "refund" },
        { date: "2024-02-01", amount: 900, kind: "transfer" },
        { date: "2024-02-01", amount: 800, kind: "income" },
        { date: "2024-02-03", amount: 1000, kind: "expense" },
      ],
    };
    const rows = dailySpendingComparison(data, "2024-02");
    assert.equal(rows.length, 29);
    assert.deepEqual(rows[0], { date: "2024-02-01", spent: 130, allowance: 100, count: 2, difference: -30 });
    assert.equal(rows[1].spent, 0);
    assert.equal(rows[2].spent, null);
    assert.equal(rows[2].difference, null);
    assert.equal(dailySpendingComparison({ ...data, budgets: [] }, "2024-02")[0].allowance, null);
    assert.equal(dailySpendingComparison({ ...data, asOf: "2025-12-31" }, "2025-02").length, 28);
    assert.equal(dailySpendingComparison(data, "2024-04").length, 30);
    assert.equal(dailySpendingComparison(data, "2024-01").length, 31);
    assert.deepEqual(dailySpendingComparison(data, { from: "2024-01-31", to: "2024-02-01" }).map(row => row.allowance), [100, 100]);
  });
  const {
    overview,
    monthlyTotals,
    accountBalance,
    categorySpent,
    forecast,
    budgetLimit,
    accountPosition,
  } = require(join(temporary, "finance/model.js"));
  const {reconcileAccount,expenseGroups,transactionGroups,spendingBasis}=require(join(temporary,"finance/reconciliation.js"));
  const {importDuplicates}=require(join(temporary,"finance/csv.js"));
  const {financeWire,financeNumbers}=require(join(temporary,"finance/wire.js"));
  const { financeDemo } = require(join(temporary, "finance/demo.js"));
  const {
    csvTemplate,
    parseFinanceCsv,
    exportTransactions,
    transactionKey,
  } = require(join(temporary, "finance/csv.js"));
  const {recentMonthRange, calendarMonthRange, periodDays, inFinancePeriod, periodMonthShares} = require(join(temporary,"finance/period.js"));
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
  test("current balance includes only active accounts and respects a baseline date", () => {
    const vcb={...data.accounts[0],id:"vcb",name:"Vietcombank",opening:818_564,openingOn:"2026-10-22",openingExcluded:0,archivedAt:null};
    const archived=data.accounts.slice(1).map((a)=>({...a,archivedAt:"2026-10-22T00:00:00Z"}));
    const scoped={...data,asOf:"2026-10-22",accounts:[vcb,...archived]};
    assert.equal(overview(scoped).accountCount,1);
    assert.equal(overview(scoped).balanceKnown,true);
    assert.equal(overview(scoped).balance,818_564);
    assert.equal(accountBalance(vcb,data.transactions,"2026-10-21"),0);
    const oldCheckpoint=reconcileAccount(scoped,vcb,"2026-10-21T12:58:28Z",818_564);
    assert.equal(oldCheckpoint.difference,null);
    assert.equal(oldCheckpoint.beforeBaseline,true);
    assert.equal(overview({...scoped,accounts:[{...vcb,openingOn:null},...archived]}).balanceKnown,false);
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
  test("CSV allows shared income/expense categories while checking archival and accounts", () => {
    const snapshot = {...data, categories: [
      {id:"1", code:"custom", name:"Custom", kind:"income", archived_at:null, revision:1},
      {id:"2", code:"old", name:"Old", kind:"expense", archived_at:"2026-10-01", revision:1},
    ]};
    const parse = (lines, input = snapshot) => parseFinanceCsv(`${csvTemplate.split("\n")[0]}\n${lines}`, input);
    assert.equal(parse("2026-10-14,Bonus,500,income,custom,bank,")[0].error, "");
    assert.equal(parse("2026-10-14,Bonus,500,income,custom,bank,")[0].newCategory, false);
    for (const [kind,code] of [["refund","old"],["income","transfer"],["income",""],["expense","a".repeat(41)]])
      assert.ok(parse(`2026-10-14,Invalid,100,${kind},${code},bank,`)[0].error);
    assert.ok(parse("2026-10-14,A,100,income,new_code,bank,\n2026-10-14,B,100,expense,new_code,bank,\n2026-10-14,C,20,refund,new_code,bank,").every(r => !r.error && r.newCategory));
    assert.equal(parse("2026-10-14,Expense,100,expense,custom,bank,")[0].error, "");
    assert.equal(parse("2026-10-14,Refund,20,refund,custom,bank,")[0].error, "");
    assert.ok(parse("2026-10-14,A,100,expense,new_code,bank,", {...snapshot,accounts:data.accounts.map(a=>({...a,archivedAt:"2026-10-01"}))})[0].error);
  });
  test("recent calendar month includes exact boundaries and clamps leap/year ends", () => {
    assert.deepEqual(recentMonthRange("2026-10-21"), {from:"2026-09-21",to:"2026-10-21"});
    assert.deepEqual(recentMonthRange("2026-03-31"), {from:"2026-02-28",to:"2026-03-31"});
    assert.deepEqual(recentMonthRange("2024-03-31"), {from:"2024-02-29",to:"2024-03-31"});
    assert.deepEqual(recentMonthRange("2026-01-01"), {from:"2025-12-01",to:"2026-01-01"});
    const range=recentMonthRange("2026-10-21");
    assert.equal(periodDays(range).length,31);
    assert.equal(inFinancePeriod("2026-09-20",range),false);
    assert.equal(inFinancePeriod("2026-09-21",range),true);
    assert.equal(inFinancePeriod("2026-10-21",range),true);
    assert.equal(inFinancePeriod("2026-10-22",range),false);
    assert.equal(periodDays("2026-10","2026-10-21").length,21);
    assert.equal(periodDays("9999-12").length,31);
    assert.deepEqual(calendarMonthRange("0001-02"),{from:"0001-02-01",to:"0001-02-28"});
  });
  test("rolling reports count income/refunds and exclude transfers from net totals", () => {
    const range=recentMonthRange("2026-10-21"), base=data.transactions[0];
    const rows=[
      {...base,date:"2026-09-20",amount:999,kind:"expense"},
      {...base,date:"2026-09-21",amount:100,kind:"expense",category:"food"},
      {...base,date:"2026-10-01",amount:500,kind:"income"},
      {...base,date:"2026-10-20",amount:20,kind:"refund",category:"food"},
      {...base,date:"2026-10-21",amount:1000,kind:"transfer"},
      {...base,date:"2026-10-22",amount:999,kind:"expense"},
    ];
    assert.deepEqual(monthlyTotals(rows,range),{income:500,expenses:80,refunds:20,net:420});
    assert.equal(categorySpent(rows,"food",range),80);
    assert.equal(rows.filter(r=>inFinancePeriod(r.date,range)).length,4);
    assert.deepEqual(monthlyTotals(rows,"2026-09"),{income:0,expenses:1099,refunds:0,net:-1099});
  });
  test("rolling budget weights each month's override without mutating defaults", () => {
    const budget={...data.budgets[0],limit:3100,monthlyLimits:{"2026-09":3000}};
    const before=JSON.stringify(budget), range=recentMonthRange("2026-10-21");
    assert.equal(budgetLimit(budget,range),3100); // 10/30 * 3000 + 21/31 * 3100
    assert.equal(budgetLimit(budget,"2026-09"),3000);
    assert.equal(budgetLimit(budget,"2026-10"),3100);
    assert.equal(periodMonthShares({from:"9999-12-01",to:"9999-12-31"}).length,1);
    assert.equal(JSON.stringify(budget),before);
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

  const fixture=(transactions=[],accounts=[{id:"bank",name:"Bank",opening:0,note:"",openingOn:"2026-09-21"}])=>({asOf:"2026-10-21",startsOn:"2026-10-21",transactions,accounts,budgets:[],goals:[],bills:[]});
  const tx=(values)=>({id:crypto.randomUUID(),date:"2026-10-01",description:"Fixture",amount:100,kind:"expense",category:"other",account:"bank",source:"manual",...values});
  test("bank baseline and exact checkpoint expose unexplained difference without a plug",()=>{
    const f=fixture([tx({amount:6086000,kind:"income",occurredAt:"2026-10-01T12:00:00+07:00"}),tx({date:"2026-10-21",amount:8358612,occurredAt:"2026-10-21T19:58:28+07:00"})],[{id:"bank",name:"Bank",opening:3110889,openingOn:"2026-09-21",note:""}]);
    const before=JSON.stringify(f),r=reconcileAccount(f,f.accounts[0],"2026-10-21T19:58:28+07:00",818564);
    assert.equal(r.calculated,838277);assert.equal(r.difference,-19713);assert.equal(JSON.stringify(f),before);
    f.transactions[1].occurredAt=undefined;assert.equal(reconcileAccount(f,f.accounts[0],"2026-10-21T19:58:28+07:00",818564).difference,null);
    f.accounts[0].openingOn=null;assert.equal(overview(f).balanceKnown,false);
  });
  test("scope payout reduces bank and excluded funds once, preserving tracked money",()=>{
    const f=fixture([],[{id:"bank",name:"Bank",opening:3000000,openingExcluded:2150000,openingOn:"2026-09-21",note:""}]);
    assert.equal(overview(f).tracked,850000);
    f.scopeEvents=[{id:"scope",revision:1,account:"bank",occurredAt:"2026-10-01T16:35:00+07:00",amount:2150000,kind:"external_outflow",evidence:"Fixture"}];
    assert.equal(overview(f).balance,850000);assert.equal(overview(f).excluded,0);assert.equal(overview(f).tracked,850000);assert.equal(monthlyTotals(f.transactions,"2026-10").expenses,0);
  });
  test("ATM budget charge keeps received cash as an asset; linked spend never charges twice",()=>{
    const atm=tx({id:"atm",amount:403300,reportingRole:"cash_withdrawal",cashReceived:400000,cashAccount:"cash",category:"transport"});
    const f=fixture([atm],[{id:"bank",name:"Bank",opening:1000000,openingOn:"2026-09-21",note:""},{id:"cash",name:"Cash",opening:0,openingOn:"2026-09-21",note:""}]);
    assert.deepEqual(spendingBasis(f.transactions,"2026-10"),{budget:403300,assetExpense:3300,difference:400000});
    assert.equal(overview(f).balance,996700);assert.equal(monthlyTotals(f.transactions,"2026-10").expenses,403300);
    f.transactions.push(tx({amount:15000,account:"cash",reportingRole:"prepaid_cash",fundingTransaction:"atm",category:"transport"}));
    assert.deepEqual(spendingBasis(f.transactions,"2026-10"),{budget:403300,assetExpense:18300,difference:385000});
    assert.equal(overview(f).balance,981700);assert.equal(accountPosition(f,f.accounts[1]).balance,385000);assert.equal(monthlyTotals(f.transactions,"2026-10").expenses,403300);
  });
  test("salary stays gross and gift is deducted once; its group exposes budget remainder",()=>{
    const f=fixture([tx({amount:4544800,kind:"income",category:"salary",reportGroup:"salary"}),tx({amount:1000000,reportGroup:"salary"})]);
    assert.deepEqual(monthlyTotals(f.transactions,"2026-10"),{income:4544800,expenses:1000000,refunds:0,net:3544800});
    assert.equal(transactionGroups(f.transactions,"2026-10")[0].net,3544800);
  });
  test("support return offsets income, gross trip costs remain and cash stays off the bank",()=>{
    const rows=[tx({amount:500000,kind:"income"}),tx({amount:500000,kind:"income"}),tx({amount:500000,reportingRole:"support_return"}),tx({amount:235000,category:"transport"}),tx({amount:250000,category:"transport"}),tx({amount:15000,category:"transport",account:"cash"})].map(t=>({...t,reportGroup:"trip"}));
    assert.deepEqual(monthlyTotals(rows,"2026-10"),{income:500000,expenses:500000,refunds:0,net:0});
    assert.equal(accountBalance({id:"bank",opening:0},rows),15000);assert.equal(accountBalance({id:"cash",opening:15000},rows),0);
  });
  test("date baselines prevent backfill double counting and Vietnam scope cutoff handles UTC",()=>{
    const f=fixture([tx({date:"2026-09-20",kind:"income",amount:900}),tx({date:"2026-10-22",amount:999})],[{id:"bank",name:"Bank",opening:1000,openingOn:"2026-09-21",note:""}]);
    f.scopeEvents=[{id:"e",revision:1,account:"bank",occurredAt:"2026-10-21T18:00:00Z",kind:"exclude",amount:100,evidence:"Next day in Vietnam"}];
    assert.equal(overview(f).balance,1000);assert.equal(overview(f).excluded,0);
    assert.equal(monthlyTotals(f.transactions,"2026-09").income,900);
  });
  test("all expense details map to exactly three reporting groups",()=>{
    const groups=expenseGroups([tx({category:"food"}),tx({category:"transport"}),tx({category:"telecom"}),tx({category:"shopping"}),tx({category:"other",kind:"refund",amount:10}),tx({reportingRole:"support_return",amount:500})],"2026-10");
    assert.deepEqual(groups,[{code:"food",amount:100},{code:"transport",amount:100},{code:"other",amount:190}]);
  });
  test("reference dedup survives description edits, across and inside files; distinct references allowed",()=>{
    const base=tx({reference:"BANK-1"});
    assert.deepEqual(importDuplicates([tx({...base,description:"Edited"}),tx({...base,reference:"BANK-2"})],[base]),[true,false]);
    assert.deepEqual(importDuplicates([base,base],[]),[false,true]);
    assert.deepEqual(importDuplicates([tx({...base,reference:undefined})],[base]),[true]);
  });
  test("full CSV round trip preserves reference, exact time, ATM policies and formula-like text",()=>{
    const source=[tx({description:"=SUM(1,2)",reference:"REF",occurredAt:"2026-10-01T08:00:00+07:00",reportGroup:"trip"})];
    const parsed=parseFinanceCsv(exportTransactions(source),fixture());assert.equal(parsed[0].error,"");
    for(const k of ["id","description","reference","occurredAt","reportGroup"])assert.equal(parsed[0].row[k],source[0][k]);
    for(const value of ["'=literal","''literal","+formula","-formula","@formula"])assert.equal(parseFinanceCsv(exportTransactions([tx({description:value})]),fixture())[0].row.description,value);
  });
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
