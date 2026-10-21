import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {localDomainSession} from './local-domain-session.mjs';
const {sql,cookie,owner}=localDomainSession();
const origin=process.env.DOMAIN_TEST_URL??'http://localhost:3000';
assert.match(origin,/^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const account=randomUUID(), category=randomUUID(), batch=randomUUID(), invalidBatch=randomUUID();
const code='qa_'+category.slice(0,8), expenseCode=code+'_expense', incomeCode=code+'_income', rollbackCode=code+'_rollback';
async function api(path, method='GET', body, expected=200) {
 const r=await fetch(origin+'/api/finance'+path,{method,headers:{Cookie:cookie,Origin:origin,'Content-Type':'application/json'},...(body&&{body:JSON.stringify(body)})});
 const result=await r.json(); assert.equal(r.status,expected,JSON.stringify(result)); return result;
}
try {
 const before=await api('');
 await api('/accounts','POST',{id:account,name:'QA categories account',opening:'0',note:''},201);
 await api('/categories','POST',{id:category,code,name:'QA manual income',kind:'income'},201);
 await api('/categories','POST',{id:randomUUID(),code,name:'Duplicate',kind:'income'},409);
 const date=before.asOf, header='date,description,amount,kind,category,account,destination\n';
 const csv=header+`${date},QA expense,100,expense,${expenseCode},${account},\n${date},QA refund,10,refund,${expenseCode},${account},\n${date},QA bonus,500,income,${incomeCode},${account},\n${date},QA manual,500,income,${code},${account},\n`;
 assert.equal((await api('/import','POST',{id:batch,csv})).count,4);
 assert.equal((await api('/import','POST',{id:batch,csv})).count,4);
 await api('/import','POST',{id:batch,csv:csv.replace('QA expense','Changed')},409);
 const after=await api('');
 assert.equal(after.transactions.length,before.transactions.length+4);
 assert.equal(after.categories.find(c=>c.code===incomeCode).kind,'income');
 assert.equal(after.categories.find(c=>c.code===code).name,'QA manual income');
 assert.equal(after.budgets.find(b=>b.id===expenseCode).limit,'0');
 const invalid=header+`${date},QA valid,10,expense,${rollbackCode},${account},\n${date},QA invalid,0,expense,${rollbackCode},${account},\n`;
 await api('/import','POST',{id:invalidBatch,csv:invalid},400);
 const final=await api('');
 assert.ok(!final.categories.some(c=>c.code===rollbackCode));
 assert.equal(final.transactions.length,after.transactions.length);
 console.log('PASS manual category API, duplicate code, new income/expense/refund CSV, persisted overview/budget, same-batch retry, changed-payload conflict, invalid-batch rollback.');
} finally {
 sql(`delete from public.finance_transactions where owner_id='${owner}' and batch_id in ('${batch}','${invalidBatch}'); delete from public.finance_import_batches where owner_id='${owner}' and id in ('${batch}','${invalidBatch}'); delete from public.finance_categories where owner_id='${owner}' and code in ('${code}','${incomeCode}','${expenseCode}','${rollbackCode}'); delete from public.finance_accounts where owner_id='${owner}' and id='${account}';`);
}
