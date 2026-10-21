import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {localDomainSession} from './local-domain-session.mjs';
const {sql,cookie,owner}=localDomainSession();
const origin=process.env.DOMAIN_TEST_URL??'http://localhost:3000';
assert.match(origin,/^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const ids=[]; const id=()=>{const value=randomUUID();ids.push(value);return value;};
async function api(path,method='GET',body,status=200){
 const r=await fetch(origin+'/api/finance'+path,{method,headers:{Cookie:cookie,Origin:origin,'Content-Type':'application/json'},...(body&&{body:JSON.stringify(body)})});
 const result=await r.json();assert.equal(r.status,status,JSON.stringify(result));return result;
}
try{
 const initial=await api(''); const account=id(),destination=id(),category=id(),budget=id(),monthRow=id(),tx=id(),bill=id(); const code='qa_'+category.slice(0,8);
 const builtin=initial.categories.find(c=>c.code==='food');
 assert.equal((await api('/categories','DELETE',{id:builtin.id,expectedRevision:builtin.revision},409)).code,'default_category_protected');
 assert.equal((await api('/categories','PATCH',{id:builtin.id,expectedRevision:builtin.revision,code:'renamed_builtin'},409)).code,'default_category_protected');
 await api('/accounts','POST',{id:account,name:'QA master source',opening:'100',note:''},201);
 await api('/accounts','POST',{id:destination,name:'QA master destination',opening:'0',note:''},201);
 await api('/categories','POST',{id:category,code,name:'QA original name',kind:'expense'},201);
 await api('/categories','PATCH',{id:category,expectedRevision:1,name:'QA renamed'});
 await api('/categories','PATCH',{id:category,expectedRevision:1,name:'Stale'},409);
 await api('/budgets','POST',{id:budget,category_id:category,name:'Legacy budget name',default_limit:'500',fixed:false},201);
 await api('/budgets','PATCH',{id:budget,expectedRevision:1,default_limit:'900',fixed:true});
 await api('/budget_months','POST',{id:monthRow,budget_id:budget,month:initial.asOf.slice(0,7)+'-01',limit_amount:'1200'},201);
 let overview=await api('');let b=overview.budgets.find(b=>b.id===code);
 assert.equal(b.name,'QA renamed');assert.equal(b.limit,'900');assert.equal(b.fixed,true);assert.equal(b.monthlyLimits[initial.asOf.slice(0,7)],'1200');
 await api('/budget_months','DELETE',{id:monthRow,expectedRevision:1});
 overview=await api('');b=overview.budgets.find(b=>b.id===code);assert.equal(b.monthlyLimits[initial.asOf.slice(0,7)],undefined);assert.equal(b.limit,'900');
 await api('/transactions','POST',{id:tx,date:initial.asOf,description:'QA master transfer',amount:'10',kind:'transfer',account_id:account,destination_account_id:destination,category_id:null,source:'manual'},201);
 await api('/accounts','DELETE',{id:account,expectedRevision:1},409);
 await api('/accounts','DELETE',{id:destination,expectedRevision:1},409);
 await api('/accounts','PATCH',{id:account,expectedRevision:1,archived_at:new Date().toISOString()});
 await api('/accounts','PATCH',{id:account,expectedRevision:2,archived_at:null});
 await api('/accounts','PATCH',{id:account,expectedRevision:2,name:'Stale'},409);
 await api('/categories','PATCH',{id:category,expectedRevision:2,kind:'income'},409);
 await api('/categories','DELETE',{id:category,expectedRevision:2},409);
 await api('/categories','PATCH',{id:category,expectedRevision:2,archived_at:new Date().toISOString()});
 await api('/categories','PATCH',{id:category,expectedRevision:3,archived_at:null,name:'QA restored'});
 overview=await api('');assert.equal(overview.categories.find(c=>c.id===category).archived_at,null);assert.equal(overview.budgets.find(b=>b.id===code).name,'QA restored');assert.ok(overview.transactions.some(t=>t.id===tx));assert.equal(overview.accounts.find(a=>a.id===account).archivedAt,null);
 await api('/bills','POST',{id:bill,name:'QA bill',due_on:initial.asOf,amount:'100'},201);
 await api('/bills','PATCH',{id:bill,expectedRevision:1,amount:'200'});
 await api('/bills','DELETE',{id:bill,expectedRevision:1},409);
 await api('/bills','DELETE',{id:bill,expectedRevision:2});
 const unused=id();await api('/categories','POST',{id:unused,code:'qa_'+unused.slice(0,8),name:'Unused',kind:'income'},201);await api('/categories','DELETE',{id:unused,expectedRevision:1});
 const unusedAccount=id();await api('/accounts','POST',{id:unusedAccount,name:'Unused',opening:'0',note:''},201);await api('/accounts','DELETE',{id:unusedAccount,expectedRevision:1});
 console.log('PASS master data: default protections, CRUD unused categories/accounts/bills, referenced source/destination delete denial, archive/restore with history, stale revision conflicts, canonical renamed budget labels, default/fixed budget and monthly override removal.');
}finally{
 const list=ids.map(v=>`'${v}'`).join(',');
 for(const table of ['finance_transactions','finance_budget_months','finance_budgets','finance_bills','finance_accounts','finance_categories'])sql(`delete from public.${table} where owner_id='${owner}' and id in (${list});`);
}
