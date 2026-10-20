import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {localDomainSession} from './local-domain-session.mjs';
const {sql,cookie,status,token,owner}=localDomainSession();
const origin=process.env.DOMAIN_TEST_URL??'http://localhost:3000';
assert.match(origin,/^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const ids=[];const make=()=>{const id=randomUUID();ids.push(id);return id;};
async function api(path,method='GET',body,expected=200){const r=await fetch(origin+'/api/'+path,{method,headers:{Cookie:cookie,Origin:'http://localhost:3000','Content-Type':'application/json'},...(body&&{body:JSON.stringify(body)})});const data=await r.json();assert.equal(r.status,expected,JSON.stringify({path,method,data}));if(method==='GET')assert.match(r.headers.get('cache-control'),/no-store/);return data;}
async function direct(path,method,body,expected){const r=await fetch(status.API_URL+'/rest/v1/'+path,{method,headers:{apikey:status.ANON_KEY,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal(r.status,expected,await r.text());}
try{
 const initial=await api('finance');const date=initial.asOf;const food=initial.categories.find(c=>c.code==='food').id,salary=initial.categories.find(c=>c.code==='salary').id;
 const a=make(),b=make();await api('finance/accounts','POST',{id:a,name:'QA source',opening:'1000000',note:''},201);await api('finance/accounts','POST',{id:b,name:'QA target',opening:'-1000',note:''},201);
 const tx=(kind,amount,extra={})=>({id:make(),date,description:'QA '+kind,kind,amount:String(amount),account_id:a,category_id:kind==='income'?salary:food,source:'manual',...extra});
 const expense=tx('expense',100000);await api('finance/transactions','POST',expense,201);await api('finance/transactions','POST',expense,200);
 await api('finance/transactions','POST',tx('transfer',250000,{category_id:null,destination_account_id:b}),201);
 await api('finance/transactions','POST',tx('refund',20000),201);await api('finance/transactions','POST',tx('income',50000),201);
 const after=await api('finance');const own=after.transactions.filter(t=>ids.includes(t.id));assert.equal(own.length,4);assert.equal(own.reduce((sum,t)=>sum+(t.kind==='income'||t.kind==='refund'?Number(t.amount):t.kind==='expense'?-Number(t.amount):0),0),-30000);assert.equal(typeof own[0].amount,'string');
 console.log('PASS Finance persisted CRUD, stable create UUID, text money, transfer/refund fixtures');
 const races=await Promise.all([api('finance/transactions','PATCH',{id:expense.id,expectedRevision:1,description:'QA updated'},200),api('finance/transactions','PATCH',{id:expense.id,expectedRevision:1,description:'QA stale'},409)]);assert.equal(races[0].revision,2);
 await api('finance/transactions','DELETE',{id:expense.id,expectedRevision:1},409);
 await api('finance/transactions','POST',tx('expense',1,{category_id:salary}),400);
 await api('finance/transactions','POST',tx('transfer',1,{category_id:null,destination_account_id:a}),400);
 await api('finance/transactions','POST',tx('expense',1,{date:'2026-02-30'}),400);
 await api('finance/transactions','POST',tx('expense','9007199254740992'),400);
 await api('finance/transactions','POST',tx('expense','0.5'),400);
 console.log('PASS Finance CAS concurrent edit/stale delete, category/date/transfer/money guards');
 const header='date,description,amount,kind,category,account,destination\r\n';const csv=header+`${date},"QA CSV, quoted",1000,expense,food,${a},\r\n`.repeat(2);const batch=make();
 await api('finance/import','POST',{id:batch,csv},200);await api('finance/import','POST',{id:batch,csv},200);assert.equal(Number(sql(`select count(*) from public.finance_transactions where batch_id='${batch}'`)),2);
 await api('finance/import','POST',{id:batch,csv:csv.replaceAll('1000','2000')},409);
 const invalidBatch=make();await api('finance/import','POST',{id:invalidBatch,csv:csv+`${date},invalid,1,expense,salary,${a},\n`},400);assert.equal(sql(`select count(*) from public.finance_import_batches where id='${invalidBatch}'`),'0');
 // Direct RPC invalid second row rolls back first row and batch, independent of parser.
 const rpcBatch=make();await direct('rpc/finance_import','POST',{p_id:rpcBatch,p_rows:[{id:make(),date,description:'good',amount:'1000',kind:'expense',account_id:a,category_id:food},{id:make(),date,description:'bad',amount:'-1',kind:'expense',account_id:a,category_id:food}]},400);assert.equal(sql(`select count(*) from public.finance_import_batches where id='${rpcBatch}'`),'0');
 console.log('PASS CSV quoted/CRLF, identical legitimate rows, atomic rollback, batch retry/hash conflict');
 const budgetCategory=make();await api('finance/categories','POST',{id:budgetCategory,code:'qa_'+budgetCategory.slice(0,8),name:'QA category',kind:'expense'},201);
 const budget=make(),month=make(),month2=make(),goal=make(),bill=make();
 await api('finance/budgets','POST',{id:budget,category_id:budgetCategory,name:'QA budget',default_limit:'50000',fixed:true},201);
 await api('finance/budget_months','POST',{id:month,budget_id:budget,month:date.slice(0,7)+'-01',limit_amount:'100000'},201);
 await api('finance/budget_months','POST',{id:month2,budget_id:budget,month:'2027-01-01',limit_amount:'200000'},201);
 await api('finance/goals','POST',{id:goal,name:'QA goal',target:'100000',allocated:'10000',monthly:'1000',deadline:'2027-01-01',priority:'normal',visual:'study'},201);
 await api('finance/bills','POST',{id:bill,name:'QA bill',due_on:date,amount:'5000'},201);
 const reports=await api('finance');assert.equal(reports.transactions.length,after.transactions.length+2);assert.equal(reports.budgets.find(b=>b.resourceId===budget).monthlyLimits['2027-01'],'200000');
 // Numeric(18,0) string view preserves values above JS safe range and API errors explicitly.
 sql(`insert into public.finance_accounts(id,owner_id,name,opening) values('${make()}','${owner}','QA large',999999999999999999);`);const bigId=ids.at(-1);assert.equal(sql(`select opening from public.finance_accounts_dto where id='${bigId}'`),'999999999999999999');await api('finance','GET',undefined,400);sql(`delete from public.finance_accounts where id='${bigId}'`);
 const historical=tx('expense',300,{category_id:budgetCategory});await api('finance/transactions','POST',historical,201);
 await api('finance/categories','PATCH',{id:budgetCategory,expectedRevision:1,archived_at:new Date().toISOString()});
 const archivedReport=await api('finance');assert(archivedReport.budgets.some(b=>b.categoryId===budgetCategory&&b.archivedAt));assert(archivedReport.transactions.some(t=>t.id===historical.id));
 console.log('PASS archived categories retain expense/report history');
 const fullBatch=make();const fullCsv=header+Array.from({length:1000},(_,i)=>`${date},QA full ${i},1,expense,food,${a},`).join('\n');await api('finance/import','POST',{id:fullBatch,csv:fullCsv});await api('finance/import','POST',{id:fullBatch,csv:fullCsv});const fullReport=await api('finance');assert.equal(fullReport.transactions.length,reports.transactions.length+1001);assert.equal(fullReport.transactions.filter(t=>t.description.startsWith('QA full ')).reduce((n,t)=>n+Number(t.amount),0),1000);
 console.log('PASS 1000-row atomic import, same-batch retry, reports exceed PostgREST 1000-row cap');
 console.log('PASS monthly budget isolation, goal/bill earmark, numeric(18,0) exact view and safe range rejection');
 const h=make();let learning=await api('learning/habits','POST',{id:h,title:'QA learning',intention:'QA',minutes:15},201);assert(learning.habits.some(x=>x.id===h));
 await api('learning/habits','PATCH',{id:h,expectedRevision:1,title:'QA edited'},200);await api('learning/habits','PATCH',{id:h,expectedRevision:1,title:'stale'},409);
 const entry=make();const check={id:entry,habitId:h,date,expectedRevision:0,minutes:20,note:'QA note'};await api('learning/checkins','POST',check,201);await api('learning/checkins','POST',check,409);
 await api('learning/checkins','POST',{...check,expectedRevision:1,minutes:30},201);await api('learning/checkins','DELETE',{...check,expectedRevision:1},409);
 learning=await api('learning/habits');assert.equal(learning.habits.find(x=>x.id===h).entries[0].minutes,30);
 await api('learning/checkins','POST',{...check,expectedRevision:2,minutes:1441},400);
 await api('learning/checkins','POST',{...check,expectedRevision:2,date:'2026-01-01'},409);
 await api('learning/habits','PATCH',{id:h,expectedRevision:2,archived:true},200);
 await api('learning/checkins','POST',{...check,expectedRevision:2},400);
 await direct('learning_checkins','POST',{id:make(),habit_id:h,checked_on:date,minutes:1},403);
 await api('learning/habits','PATCH',{id:h,expectedRevision:3,archived:false},200);await api('learning/checkins','DELETE',{...check,expectedRevision:2},200);
 assert.equal((await api('learning/habits')).habits.find(x=>x.id===h).entries.length,0);
 console.log('PASS Learning create/edit/archive/resume/check-in/undo persistence, one/day, minutes, archived, stale undo/direct write deny');
 for(const path of ['finance','finance/accounts','learning/habits','learning/checkins']){const r=await fetch(origin+'/api/'+path);assert.equal(r.status,401);}
 console.log('PASS anonymous API denial and private/no-store responses');
}finally{
 const list=ids.map(id=>`'${id}'`).join(',');
 for(const table of ['learning_checkins','learning_habits','finance_transactions','finance_import_batches','finance_budget_months','finance_budgets','finance_goals','finance_bills','finance_accounts','finance_categories'])sql(`delete from public.${table} where id in (${list})${table==='finance_transactions'?` or batch_id in (${list})`:''};`);
 console.log('Cleaned only explicit fixture UUIDs; owner/settings untouched.');
}
