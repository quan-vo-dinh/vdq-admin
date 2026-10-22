import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {localDomainSession} from './local-domain-session.mjs';
const {sql,cookie,owner}=localDomainSession();
const origin='http://localhost:3000',ids=[],batches=[];
const id=()=>{const v=randomUUID();ids.push(v);return v;};
async function api(path,method='GET',body,expected=200){
 const response=await fetch(origin+'/api/finance'+path,{method,headers:{Cookie:cookie,Origin:origin,'Content-Type':'application/json'},...(body&&{body:JSON.stringify(body)})});
 const result=await response.json();assert.equal(response.status,expected,JSON.stringify(result));return result;
}
try{
 const initial=await api(''),bank=id(),cash=id(),checkpoint=id(),event=id();
 await api('/accounts','POST',{id:bank,name:'QA audit bank',opening:'1000000',note:'Disposable reconciliation fixture',opening_on:'2026-09-21',opening_excluded:'100'},201);
 await api('/accounts','POST',{id:cash,name:'QA audit cash',opening:'0',note:'Disposable reconciliation fixture',opening_on:'2026-09-21'},201);
 await api('/checkpoints','POST',{id:checkpoint,account_id:bank,observed_at:'2026-10-01T12:00:00+07:00',amount:'818',evidence:'QA fixture, not real bank data'},201);
 const got=await api('');assert.equal(got.checkpoints.find(c=>c.id===checkpoint).amount,'818');assert.equal(got.accounts.find(a=>a.id===bank).openingOn,'2026-09-21');
 await api('/scope_events','POST',{id:event,account_id:bank,occurred_at:'2026-10-02T12:00:00+07:00',amount:'100',kind:'external_outflow',evidence:'QA scope payout'},201);
 await api('/scope_events','PATCH',{id:event,expectedRevision:99,amount:'50'},409);
 const header='date,description,amount,kind,category,account,destination,id,reference,occurred_at,reporting_role,report_group,cash_account,cash_received,funding_transaction';
 const csv=header+`\n2026-10-03,QA ATM,103,expense,transport,${bank},,atm,QA-ATM,2026-10-03T08:00:00+07:00,cash_withdrawal,qa,${cash},100,\n2026-10-04,QA linked spend,15,expense,transport,${cash},,spend,QA-SPEND,2026-10-04T08:00:00+07:00,prepaid_cash,qa,,0,atm`;
 const batch=randomUUID();batches.push(batch);assert.equal((await api('/import','POST',{id:batch,csv})).count,2);
 assert.equal((await api('/import','POST',{id:batch,csv})).count,2);
 const duplicate=randomUUID();batches.push(duplicate);assert.equal((await api('/import','POST',{id:duplicate,csv},409)).code,'duplicate_transaction');
 const imported=(await api('')).transactions.filter(t=>t.account===bank||t.account===cash);
 const atm=imported.find(t=>t.reportingRole==='cash_withdrawal'),spend=imported.find(t=>t.reportingRole==='prepaid_cash');
 assert.equal(atm.cashReceived,'100');assert.equal(spend.fundingTransaction,atm.id);
 await api('/transactions','PATCH',{id:spend.id,expectedRevision:spend.revision,amount:'101'},400);
 assert.equal((await fetch(origin+'/api/finance/checkpoints')).status,401);
 assert.equal((await fetch(origin+'/api/finance/scope_events')).status,401);
 const exportBatch=randomUUID();batches.push(exportBatch);
 const prefix='QA-audit-export';
 const exportCsv='date,description,amount,kind,category,account,destination\n'+Array.from({length:46},(_,i)=>`${initial.asOf},${prefix}-${i+1},100,expense,food,${bank},`).join('\n');
 assert.equal((await api('/import','POST',{id:exportBatch,csv:exportCsv})).count,46);
 console.log('PASS local API: exact money DTOs, baseline/checkpoint/scope persistence, stale revision rejection, ATM funding remap, duplicate rollback, same-batch retry, allocation bounds, anonymous denial, 46-row export fixture.');
 if(process.argv.includes('--hold')){console.log('BROWSER_FIXTURE_READY: search QA-audit-export; expect 46 rows. Send newline to clean fixtures.');process.stdin.resume();await new Promise(resolve=>{const timer=setTimeout(resolve,1200000);process.stdin.once('data',()=>{clearTimeout(timer);resolve();});});process.stdin.pause();}
}finally{
 const list=ids.map(v=>`'${v}'`).join(','),batchList=batches.map(v=>`'${v}'`).join(',')||'null';
 sql(`begin; delete from public.finance_transactions where owner_id='${owner}' and (account_id in (${list}) or batch_id in (${batchList})) and reporting_role='prepaid_cash'; delete from public.finance_transactions where owner_id='${owner}' and (account_id in (${list}) or batch_id in (${batchList})); delete from public.finance_checkpoints where owner_id='${owner}' and id in (${list}); delete from public.finance_scope_events where owner_id='${owner}' and id in (${list}); delete from public.finance_accounts where owner_id='${owner}' and id in (${list}); delete from public.finance_import_batches where owner_id='${owner}' and id in (${batchList}); commit;`);
 console.log('Local fixtures removed; existing owner data preserved.');
}
