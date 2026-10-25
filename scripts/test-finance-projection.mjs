import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createRequire} from 'node:module';
const {tables,validate:validateBackup}=await import('./backend/backup.mjs');
const legacyBackup={format:'dashboard-business-v1',owner:{enabled:true,user_id:'00000000-0000-4000-8000-000000000001',github_user_id:'1'},media:[],versions:[],migrations:[],data:Object.fromEntries(tables.filter(t=>t!=='finance_projection_plans').map(t=>[t,[]]))};
assert.deepEqual(validateBackup(legacyBackup).data.finance_projection_plans,[]);
const output=mkdtempSync(join(tmpdir(),'salary-projection-'));
try{
  execFileSync('pnpm',['exec','tsc','--ignoreConfig','--target','es2022','--module','commonjs','--skipLibCheck','--outDir',output,'lib/finance/projection.ts']);
  const {emptySavingsPlan,validateSavingsPlan,projectionRows,projectedGoals,lastDay,payrollMonths,savingsPlanFingerprint,projectionChartDate}=createRequire(import.meta.url)(join(output,'projection.js'));
  const paydayTimestamp=Date.parse('2026-10-31T00:00:00Z');
  for(const value of [paydayTimestamp,String(paydayTimestamp),'2026-10-31'])assert.equal(projectionChartDate(value),'2026-10-31');
  for(const value of [undefined,null,'',' ','Tiết kiệm tích lũy','2026-02-30',NaN,Infinity,1e20,{},[]])assert.equal(projectionChartDate(value),null,'Transient chart labels must not throw or become invented dates');
  const first='00000000-0000-4000-8000-000000000001',second='00000000-0000-4000-8000-000000000002';
  const plan={...emptySavingsPlan('2026-10-25'),endDate:'2026-12-31',goalIds:[first,second],cycles:{
    '2026-10':{income:'8000000',spending:'3000000',savingDate:'2026-10-31'},
    '2026-11':{income:'8000000',spending:'4000000',savingDate:'2026-11-30'},
    '2026-12':{income:'9000000',spending:'4000000',savingDate:'2026-12-31'},
  }};
  const p=projectionRows(plan,1200000);
  assert.equal(p.initial,0);assert.equal(p.end,14000000);
  assert.deepEqual(p.rows.map(r=>r.surplus),[5000000,4000000,5000000]);
  assert.deepEqual(p.chart.map(r=>[r.date,r.balance]),[['2026-10-25',0],['2026-10-31',5000000],['2026-11-30',9000000],['2026-12-31',14000000]],'Money is not available before the exact contribution date');
  assert.equal(p.rows[0].expenseFrom,'2026-11-01');assert.equal(p.rows[0].expenseTo,'2026-11-30');
  assert.equal(p.rows[2].expenseFrom,'2027-01-01');assert.equal(p.rows[2].expenseTo,'2027-01-31');
  assert.equal(lastDay('2028-02'),'2028-02-29');assert.equal(lastDay('2027-02'),'2027-02-28');
  assert.deepEqual(payrollMonths('2028-01-25','2028-02-28'),['2028-01'],'No February salary is earned before leap-year payday');
  const goals=[{id:first,name:'First',target:5000000,deadline:'2026-10-31'},{id:second,name:'Second',target:5000000,deadline:'2026-12-01'}];
  const result=projectedGoals(plan,0,goals);
  assert.equal(result[0].reachedDate,'2026-10-31');assert.equal(result[1].required,10000000);assert.equal(result[1].reachedDate,'2026-12-31');
  assert.equal(projectionRows({...plan,baseMode:'current',openingReserve:'300000'},1200000).initial,900000);
  assert.equal(projectionRows({...plan,baseMode:'manual',manualBase:'2000000',openingReserve:'500000'},1200000).end,15500000);
  assert.equal(projectionRows({...plan,baseMode:'current'},1200000).initial,null,'Unspecified spending reserve cannot silently become zero');
  assert.equal(projectionRows({...plan,baseMode:'current',openingReserve:'0'},null).end,null);
  const missing={...plan,cycles:{...plan.cycles,'2026-11':{...plan.cycles['2026-11'],spending:''}}};
  assert.equal(projectionRows(missing,0).end,null);
  const unknownDeferred={...missing,endDate:'2026-12-05',cycles:{...missing.cycles,'2026-11':{...missing.cycles['2026-11'],savingDate:'2026-12-10'}}};
  assert.equal(projectionRows(unknownDeferred,0).end,null,'An unknown salary/budget may need a payday drawdown even when a later saving date was selected');
  assert.equal(projectionRows({...missing,cycles:{...missing.cycles,'2026-11':{income:'0',spending:'0',savingDate:'2026-11-30'}}},0).end,10000000);
  const delayed={...plan,cycles:{...plan.cycles,'2026-10':{...plan.cycles['2026-10'],savingDate:'2026-12-10'}}};
  assert.deepEqual(projectionRows(delayed,0).chart.map(r=>[r.date,r.balance]),[['2026-10-25',0],['2026-11-30',4000000],['2026-12-10',9000000],['2026-12-31',14000000]],'Delayed contributions must sort chronologically across salary cycles');
  const outside={...delayed,endDate:'2026-12-05'};
  assert.equal(projectionRows(outside,0).end,4000000);assert.equal(projectionRows(outside,0).rows[0].inHorizon,false);
  const deficit={...plan,cycles:{...plan.cycles,'2026-11':{income:'2000000',spending:'3000000',savingDate:'2026-12-10'}}};
  assert.equal(projectionRows(deficit,0).rows[1].eventDate,'2026-11-30');assert.equal(projectionRows(deficit,0).end,9000000,'Budget deficit is withdrawn once on payday, never deferred or deducted twice');
  const grouped={...plan,cycles:{...plan.cycles,'2026-10':{...plan.cycles['2026-10'],savingDate:'2026-12-01'},'2026-11':{...plan.cycles['2026-11'],savingDate:'2026-12-01'}}};
  assert.equal(projectionRows(grouped,0).chart.find(r=>r.date==='2026-12-01').balance,9000000);
  const old=validateSavingsPlan({version:1,startMonth:'2026-10',months:3,baseMode:'none',manualBase:'0',amounts:{'2026-10':'5000000'},goalIds:[]});
  assert.equal(old.version,2);assert.equal(old.cycles['2026-10'].legacyNet,'5000000');assert.equal(old.cycles['2026-10'].income,'');assert.equal(projectionRows(old,0).end,null,'Legacy surplus must not become fabricated salary or a confirmed dated contribution');
  assert.deepEqual(validateSavingsPlan(plan),plan);
  const reordered={...plan,cycles:Object.fromEntries(Object.entries(plan.cycles).reverse())};assert.equal(savingsPlanFingerprint(plan),savingsPlanFingerprint(reordered));
  for(const patch of [{startDate:'2026-02-30'},{endDate:'2026-10-30'},{endDate:'2036-10-31'},{baseMode:['current']},{openingReserve:'-1'},{goalIds:[first,first]},{cycles:{'2026-10':{income:'8000000',spending:'3000000',savingDate:'2026-10-30'}}},{cycles:{'2026-10':{income:'1.5',spending:'0',savingDate:'2026-10-31'}}}])assert.throws(()=>validateSavingsPlan({...plan,...patch}));
  const migration=readFileSync('supabase/migrations/20261025000200_finance_salary_cycle_projection.sql','utf8');assert.match(migration,/version":2/);assert.doesNotMatch(migration,/delete from|update public\./i);
  console.log('PASS: exact paydays, next-month budgets, leap years, net savings, opening reserves, delayed/grouped dates, deficits, goal dates, missing values, legacy preservation and validation.');
}finally{rmSync(output,{recursive:true,force:true});}
