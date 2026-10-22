import 'server-only';
import { createHash } from 'node:crypto';
import { requireOwner } from '@/lib/auth/owner';
import { AccessError } from '@/lib/auth/policy';
import { dbError, input, revision, uuid } from '@/lib/backend/mutations';
import { todayKey } from '@/lib/learning/model';
import { categoryCodePattern, parseFinanceCsv } from './csv';
import { isDefaultCategory } from './master-data';
import { financeWire } from './wire';
import type { FinanceData } from './model';
import type { Database } from '@/types/database';

type Table = Extract<keyof Database['public']['Tables'], `finance_${string}`>;
const resources = ['accounts','categories','transactions','budgets','budget_months','goals','bills','settings','checkpoints','scope_events'] as const;
type Resource = typeof resources[number];
const fields: Record<Resource,string[]> = {
 accounts:['name','opening','note','archived_at','opening_on','opening_excluded'], categories:['code','name','kind','archived_at'],
 transactions:['date','description','amount','kind','account_id','destination_account_id','category_id','source','reference','occurred_at','reporting_role','report_group','cash_account_id','cash_received','funding_transaction_id'],
 budgets:['category_id','name','default_limit','fixed'], budget_months:['budget_id','month','limit_amount'],
 goals:['name','target','allocated','monthly','deadline','priority','visual'], bills:['name','due_on','amount'], settings:['starts_on'], checkpoints:['account_id','observed_at','amount','evidence'], scope_events:['account_id','occurred_at','amount','kind','evidence'],
};
const moneyFields = new Set(['opening','opening_excluded','cash_received','amount','default_limit','limit_amount','target','allocated','monthly']);
function checkedMoney(value: unknown) {
 if(typeof value!=='string' || !/^-?\d{1,18}$/.test(value)) throw new AccessError(400,'invalid_money');
 const exact=BigInt(value);
 if(exact>BigInt(Number.MAX_SAFE_INTEGER)||exact<BigInt(Number.MIN_SAFE_INTEGER)) throw new AccessError(400,'money_outside_ui_range');
 return value;
}
// Numeric DTO strings arrive here without ever passing through a JSON number.
function number(value: string | null) { checkedMoney(value); return Number(value); }
export async function financeOverview(): Promise<FinanceData> {
 const {supabase:db,user}=await requireOwner();
 // Idempotent metadata only, no balances, goals or transactions are seeded.
 const existing=await db.from('finance_categories').select('code').eq('owner_id',user.id); dbError(existing.error);
 const codes=[['food','Ăn uống'],['home','Nhà ở'],['transport','Di chuyển'],['shopping','Mua sắm'],['learning','Học tập'],['fun','Giải trí'],['other','Khác'],['salary','Lương thực nhận'],['freelance','Thu nhập khác']];
 for(const [code,name] of codes) if(!existing.data!.some(c=>c.code===code)) {
  const r=await db.from('finance_categories').insert({id:crypto.randomUUID(),code,name,kind:['salary','freelance'].includes(code)?'income':'expense'}); if(r.error?.code!=='23505') dbError(r.error);
 }
 const settings=await db.from('finance_settings').select().eq('owner_id',user.id).maybeSingle(); dbError(settings.error);
 if(!settings.data) { const r=await db.from('finance_settings').insert({id:user.id}); if(r.error?.code!=='23505') dbError(r.error); }
 // The typed DTO relations are aggregated in one owner-scoped SQL statement.
 // JSON aggregation also avoids PostgREST's default row cap.
 const snapshot=await db.rpc('finance_snapshot');dbError(snapshot.error);
 type Views=Database['public']['Views'];
 type Tables=Database['public']['Tables'];
 const {accounts,categories,transactions,budgets,months,goals,bills,checkpoints,scopeEvents,settings:current}=snapshot.data as unknown as {
  accounts:Views['finance_accounts_dto']['Row'][]; categories:Tables['finance_categories']['Row'][];
  transactions:Views['finance_transactions_dto']['Row'][]; budgets:Views['finance_budgets_dto']['Row'][];
  months:Views['finance_budget_months_dto']['Row'][]; goals:Views['finance_goals_dto']['Row'][];
  bills:Views['finance_bills_dto']['Row'][]; checkpoints:Views['finance_checkpoints_dto']['Row'][];
  scopeEvents:Views['finance_scope_events_dto']['Row'][]; settings:Tables['finance_settings']['Row']|null;
 };
 if(!current)throw new AccessError(500,'finance_settings_missing');
 // Conservative exact bound covers intermediate sums and differences used by the existing charts.
 const magnitude=[...accounts.flatMap(a=>[a.opening,a.opening_excluded]),...transactions.flatMap(t=>[t.amount,t.cash_received]),...checkpoints.map(c=>c.amount),...scopeEvents.map(e=>e.amount),...goals.flatMap(g=>[g.target,g.allocated,g.monthly]),...bills.map(b=>b.amount),...budgets.map(b=>b.default_limit),...months.map(m=>m.limit_amount)].reduce((s,v)=>s+(BigInt(v!)<BigInt(0)?-BigInt(v!):BigInt(v!)),BigInt(0));
 if(magnitude>BigInt(Number.MAX_SAFE_INTEGER)/BigInt(4)) throw new AccessError(400,'money_outside_ui_range');
 const categoryCode=(id:string|null)=>categories.find(c=>c.id===id)?.code??'transfer';
 return {checkpoints:checkpoints.map(c=>({id:c.id!,revision:c.revision!,account:c.account_id!,observedAt:c.observed_at!,amount:number(c.amount),evidence:c.evidence!})),scopeEvents:scopeEvents.map(e=>({id:e.id!,revision:e.revision!,account:e.account_id!,occurredAt:e.occurred_at!,amount:number(e.amount),kind:e.kind as 'exclude'|'release'|'external_outflow',evidence:e.evidence!})),asOf:todayKey(),startsOn:current.starts_on,settings:current,categories,
 accounts:accounts.map(a=>({id:a.id!,name:a.name!,opening:number(a.opening),note:a.note!,revision:a.revision!,archivedAt:a.archived_at,openingOn:a.opening_on,openingExcluded:number(a.opening_excluded)})),
 transactions:transactions.map(t=>({id:t.id!,revision:t.revision!,date:t.date!,description:t.description!,amount:number(t.amount),kind:t.kind as 'income'|'expense'|'refund'|'transfer',account:t.account_id!,destination:t.destination_account_id??undefined,category:categoryCode(t.category_id),source:t.source as 'csv'|'manual',reference:t.reference??undefined,occurredAt:t.occurred_at??undefined,reportingRole:t.reporting_role as 'standard'|'support_return'|'cash_withdrawal'|'prepaid_cash',reportGroup:t.report_group??undefined,cashAccount:t.cash_account_id??undefined,cashReceived:number(t.cash_received),fundingTransaction:t.funding_transaction_id??undefined})),
 budgets:categories.filter(c=>c.kind==='expense'||budgets.some(b=>b.category_id===c.id)||transactions.some(t=>t.category_id===c.id&&(t.kind==='expense'||t.kind==='refund'))).map(c=> {const b=budgets.find(b=>b.category_id===c.id);return {id:c.code,archivedAt:c.archived_at,name:c.name,limit:b?number(b.default_limit):0,fixed:b?.fixed??false,resourceId:b?.id??undefined,revision:b?.revision??undefined,categoryId:c.id,monthlyLimits:Object.fromEntries(months.filter(m=>m.budget_id===b?.id).map(m=>[m.month!.slice(0,7),number(m.limit_amount)])),monthRows:months.filter(m=>m.budget_id===b?.id).map(m=>({id:m.id!,month:m.month!,revision:m.revision!}))};}),
 goals:goals.map(g=>({id:g.id!,revision:g.revision!,name:g.name!,target:number(g.target),allocated:number(g.allocated),monthly:number(g.monthly),deadline:g.deadline!,priority:g.priority as 'high'|'normal',visual:g.visual as 'study',image:g.image_path?`/api/finance/goals/image?id=${g.id}`:undefined})),
 bills:bills.map(b=>({id:b.id!,revision:b.revision!,name:b.name!,date:b.due_on!,amount:number(b.amount)}))};
}
export async function financeRequest(request:Request,resource?:string) {
 if(!resource) return Response.json(financeWire(await financeOverview()));
 const {supabase:db,user}=await requireOwner();
 if(resource==='import') {
  const text=await request.text(); if(Buffer.byteLength(text)>1_100_000) throw new AccessError(400,'payload_too_large');
  let body; try{body=JSON.parse(text);}catch{throw new AccessError(400,'invalid');}
  if(!body||typeof body!=='object'||Array.isArray(body)) throw new AccessError(400,'invalid');
  const id=uuid(body.id); if(typeof body.csv!=='string'||Buffer.byteLength(body.csv)>1_000_000) throw new AccessError(400,'invalid');
  let parsed; const data=await financeOverview(); try{parsed=parseFinanceCsv(body.csv,data);}catch{throw new AccessError(400,'invalid_csv');}
  if(parsed.some(r=>r.error)) throw new AccessError(400,'invalid_csv');
  const importedIds=new Map(parsed.map(({row},i)=>[row.id,stableRowId(id,i)]));
  const rows=parsed.map(({row},i)=>({id:stableRowId(id,i),date:row.date,description:row.description,amount:String(row.amount),kind:row.kind,account_id:row.account,destination_account_id:row.destination??null,category_code:row.kind==='transfer'?null:row.category,reference:row.reference??null,occurred_at:row.occurredAt??null,reporting_role:row.reportingRole??'standard',report_group:row.reportGroup??null,cash_account_id:row.cashAccount??null,cash_received:String(row.cashReceived??0),funding_transaction_id:row.fundingTransaction?(importedIds.get(row.fundingTransaction)??row.fundingTransaction):null}));
  const r=await db.rpc('finance_import',{p_id:id,p_rows:rows}); if(r.error?.code==='23505') throw new AccessError(409,'duplicate_transaction');
  dbError(r.error); return Response.json({count:r.data});
 }
 if(!resources.includes(resource as Resource)) throw new AccessError(404,'missing');
 const key=resource as Resource,table=`finance_${key}` as Table;
 if(request.method==='GET') {const r=await db.from(table).select('id,revision').eq('owner_id',user.id);dbError(r.error);return Response.json(r.data);}
 const body=await input(request),id=uuid(body.id);
 if(key==='budgets'&&request.method==='DELETE') {
  const result=await db.rpc('finance_remove_budget',{p_budget_id:id,p_revision:revision(body.expectedRevision)});
  dbError(result.error);
  if(!result.data) throw new AccessError(409,'conflict');
  return Response.json({id});
 }
 const values:Record<string,unknown>={};
 for(const field of fields[key]) if(body[field]!==undefined) {
  const value=body[field];
  if(moneyFields.has(field)) values[field]=checkedMoney(value);
  else if(['fixed'].includes(field)) {if(typeof value!=='boolean')throw new AccessError(400,'invalid');values[field]=value;}
  else if(field.endsWith('_id')) values[field]=value===null?null:uuid(value);
  else {
   if(value!==null&&typeof value!=='string')throw new AccessError(400,'invalid');
   if(value===null&&!['archived_at','opening_on','reference','occurred_at','report_group'].includes(field))throw new AccessError(400,'invalid');
   if(['date','month','deadline','due_on','starts_on','opening_on'].includes(field)&&value!==null&&
     (typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value))throw new AccessError(400,'invalid_date');
   if(['occurred_at','observed_at'].includes(field)&&value!==null&&(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)||!Number.isFinite(Date.parse(value))||Date.parse(value)>Date.now()))throw new AccessError(400,'invalid_timestamp');
   values[field]=value;
  }
 }
 if(key==='goals'&&(body.image||body.image_path)) throw new AccessError(400,'use_image_endpoint');
 // CAS mutations never accept owner, timestamps, revisions or an entire FinanceData object.
 const perform = async () => {
  switch(key) {
   case 'checkpoints': {
    const q=db.from('finance_checkpoints');
    return request.method==='POST'?await q.insert({id,...values} as unknown as Database['public']['Tables']['finance_checkpoints']['Insert']).select('id,revision'):request.method==='DELETE'?await q.delete().eq('id',id).eq('owner_id',user.id).eq('revision',revision(body.expectedRevision)).select('id,revision'):await q.update(values as Database['public']['Tables']['finance_checkpoints']['Update']).eq('id',id).eq('owner_id',user.id).eq('revision',revision(body.expectedRevision)).select('id,revision');
   }
   case 'scope_events': {
    const q=db.from('finance_scope_events');
    return request.method==='POST'?await q.insert({id,...values} as unknown as Database['public']['Tables']['finance_scope_events']['Insert']).select('id,revision'):request.method==='DELETE'?await q.delete().eq('id',id).eq('owner_id',user.id).eq('revision',revision(body.expectedRevision)).select('id,revision'):await q.update(values as Database['public']['Tables']['finance_scope_events']['Update']).eq('id',id).eq('owner_id',user.id).eq('revision',revision(body.expectedRevision)).select('id,revision');
   }
   case 'accounts': {
    const q=db.from('finance_accounts');
    return request.method==='POST'? await q.insert({id,...values} as unknown as Database['public']['Tables']['finance_accounts']['Insert']).select('id,revision') : request.method==='DELETE'?await q.delete().eq('id',id).eq('owner_id',user.id).eq('revision',revision(body.expectedRevision)).select('id,revision'):await q.update(values as Database['public']['Tables']['finance_accounts']['Update']).eq('id',id).eq('owner_id',user.id).eq('revision',revision(body.expectedRevision)).select('id,revision');
   }
   case 'categories': {
    const q=db.from('finance_categories');
    return request.method==='POST'? await q.insert({id,...values} as unknown as Database['public']['Tables']['finance_categories']['Insert']).select('id,revision') : request.method==='DELETE'?await q.delete().eq('id',id).eq('owner_id',user.id).eq('revision',revision(body.expectedRevision)).select('id,revision'):await q.update(values as Database['public']['Tables']['finance_categories']['Update']).eq('id',id).eq('owner_id',user.id).eq('revision',revision(body.expectedRevision)).select('id,revision');
   }
   case 'transactions': {
    const q=db.from('finance_transactions');
    return request.method==='POST'? await q.insert({id,...values} as unknown as Database['public']['Tables']['finance_transactions']['Insert']).select('id,revision') : request.method==='DELETE'?await q.delete().eq('id',id).eq('owner_id',user.id).eq('revision',revision(body.expectedRevision)).select('id,revision'):await q.update(values as Database['public']['Tables']['finance_transactions']['Update']).eq('id',id).eq('owner_id',user.id).eq('revision',revision(body.expectedRevision)).select('id,revision');
   }
   case 'budgets': {
    const q=db.from('finance_budgets');
    return request.method==='POST'? await q.insert({id,...values} as unknown as Database['public']['Tables']['finance_budgets']['Insert']).select('id,revision') : request.method==='DELETE'?await q.delete().eq('id',id).eq('owner_id',user.id).eq('revision',revision(body.expectedRevision)).select('id,revision'):await q.update(values as Database['public']['Tables']['finance_budgets']['Update']).eq('id',id).eq('owner_id',user.id).eq('revision',revision(body.expectedRevision)).select('id,revision');
   }
   case 'budget_months': {
    const q=db.from('finance_budget_months');
    return request.method==='POST'? await q.insert({id,...values} as unknown as Database['public']['Tables']['finance_budget_months']['Insert']).select('id,revision') : request.method==='DELETE'?await q.delete().eq('id',id).eq('owner_id',user.id).eq('revision',revision(body.expectedRevision)).select('id,revision'):await q.update(values as Database['public']['Tables']['finance_budget_months']['Update']).eq('id',id).eq('owner_id',user.id).eq('revision',revision(body.expectedRevision)).select('id,revision');
   }
   case 'goals': {
    const q=db.from('finance_goals');
    return request.method==='POST'? await q.insert({id,...values} as unknown as Database['public']['Tables']['finance_goals']['Insert']).select('id,revision') : request.method==='DELETE'?await q.delete().eq('id',id).eq('owner_id',user.id).eq('revision',revision(body.expectedRevision)).select('id,revision'):await q.update(values as Database['public']['Tables']['finance_goals']['Update']).eq('id',id).eq('owner_id',user.id).eq('revision',revision(body.expectedRevision)).select('id,revision');
   }
   case 'bills': {
    const q=db.from('finance_bills');
    return request.method==='POST'? await q.insert({id,...values} as unknown as Database['public']['Tables']['finance_bills']['Insert']).select('id,revision') : request.method==='DELETE'?await q.delete().eq('id',id).eq('owner_id',user.id).eq('revision',revision(body.expectedRevision)).select('id,revision'):await q.update(values as Database['public']['Tables']['finance_bills']['Update']).eq('id',id).eq('owner_id',user.id).eq('revision',revision(body.expectedRevision)).select('id,revision');
   }
   case 'settings': {
    const q=db.from('finance_settings');
    return request.method==='POST'? await q.insert({id,...values} as unknown as Database['public']['Tables']['finance_settings']['Insert']).select('id,revision') : request.method==='DELETE'?await q.delete().eq('id',id).eq('owner_id',user.id).eq('revision',revision(body.expectedRevision)).select('id,revision'):await q.update(values as Database['public']['Tables']['finance_settings']['Update']).eq('id',id).eq('owner_id',user.id).eq('revision',revision(body.expectedRevision)).select('id,revision');
   }
  }
 };
 if(key==='categories') {
  if(request.method!=='POST') {
   const current=await db.from('finance_categories').select('code,kind').eq('id',id).eq('owner_id',user.id).maybeSingle();dbError(current.error);
   if(current.data && isDefaultCategory(current.data.code) && (request.method==='DELETE'||(values.code!==undefined&&values.code!==current.data.code)||(values.kind!==undefined&&values.kind!==current.data.kind))) throw new AccessError(409,'default_category_protected');
  }
  if(values.code!==undefined && (typeof values.code!=='string'||!categoryCodePattern.test(values.code)||values.code==='transfer')) throw new AccessError(400,'invalid_category_code');
  if(values.name!==undefined && (typeof values.name!=='string'||!values.name.trim()||values.name.trim().length>80)) throw new AccessError(400,'invalid_category_name');
  if(values.kind!==undefined && !['income','expense'].includes(String(values.kind))) throw new AccessError(400,'invalid_category_kind');
 }
 const result=await perform();
 if(request.method==='POST'&&result.error?.code==='23505') {
  const r=await db.from(table).select('id,revision').eq('id',id).eq('owner_id',user.id).maybeSingle();dbError(r.error);if(!r.data) throw new AccessError(409,'conflict');return Response.json(r.data);
 }
 if(result.error?.code==='23514'&&result.error.message.includes('category has history')) throw new AccessError(409,'category_has_history');
 if(result.error?.code==='23502') throw new AccessError(400,'invalid');
 if(result.error?.code==='23503'||result.error?.code==='23505') throw new AccessError(409,'referenced_or_conflict');
 dbError(result.error);
 if(!result.data?.length) {const r=await db.from(table).select('id').eq('id',id).eq('owner_id',user.id).maybeSingle();dbError(r.error);throw new AccessError(r.data?409:404,r.data?'conflict':'missing');}
 return Response.json(result.data[0],{status:request.method==='POST'?201:200});
}
// Deterministic UUID per batch row keeps the exact payload stable on retry.
function stableRowId(batch:string,index:number) {
 const bytes=createHash('sha256').update(batch+':'+index).digest().subarray(0,16);
 bytes[6]=(bytes[6]&15)|80;bytes[8]=(bytes[8]&63)|128;
 const hex=bytes.toString('hex');return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
