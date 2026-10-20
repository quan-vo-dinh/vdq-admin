import 'server-only';
import { createHash } from 'node:crypto';
import { requireOwner } from '@/lib/auth/owner';
import { AccessError } from '@/lib/auth/policy';
import { dbError, input, revision, uuid } from '@/lib/backend/mutations';
import { todayKey } from '@/lib/learning/model';
import { parseFinanceCsv } from './csv';
import { financeWire } from './wire';
import type { FinanceData } from './model';
import type { Database } from '@/types/database';

type Table = Extract<keyof Database['public']['Tables'], `finance_${string}`>;
const resources = ['accounts','categories','transactions','budgets','budget_months','goals','bills','settings'] as const;
type Resource = typeof resources[number];
const fields: Record<Resource,string[]> = {
 accounts:['name','opening','note','archived_at'], categories:['code','name','kind','archived_at'],
 transactions:['date','description','amount','kind','account_id','destination_account_id','category_id','source'],
 budgets:['category_id','name','default_limit','fixed'], budget_months:['budget_id','month','limit_amount'],
 goals:['name','target','allocated','monthly','deadline','priority','visual'], bills:['name','due_on','amount'], settings:['starts_on'],
};
const moneyFields = new Set(['opening','amount','default_limit','limit_amount','target','allocated','monthly']);
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
 // Read every row in stable UUID order: PostgREST's 1000-row cap must not truncate reports.
 async function all<T>(query:(from:number,to:number)=>PromiseLike<{data:T[]|null;error:{code?:string;message:string}|null}>) {
  const rows:T[]=[]; for(let offset=0;;offset+=500) {const r=await query(offset,offset+499); dbError(r.error); rows.push(...r.data!); if(r.data!.length<500) return rows;}
 }
 const [accounts,categories,transactions,budgets,months,goals,bills,current]=await Promise.all([
 all((a,b)=>db.from('finance_accounts_dto').select().eq('owner_id',user.id).order('id').range(a,b)),
 all((a,b)=>db.from('finance_categories').select().eq('owner_id',user.id).order('id').range(a,b)),
 all((a,b)=>db.from('finance_transactions_dto').select().eq('owner_id',user.id).order('id').range(a,b)),
 all((a,b)=>db.from('finance_budgets_dto').select().eq('owner_id',user.id).order('id').range(a,b)),
 all((a,b)=>db.from('finance_budget_months_dto').select().eq('owner_id',user.id).order('id').range(a,b)),
 all((a,b)=>db.from('finance_goals_dto').select().eq('owner_id',user.id).order('id').range(a,b)),
 all((a,b)=>db.from('finance_bills_dto').select().eq('owner_id',user.id).order('id').range(a,b)),
 db.from('finance_settings').select().eq('owner_id',user.id).single(),
 ]); dbError(current.error);
 // Conservative exact bound covers intermediate sums and differences used by the existing charts.
 const magnitude=[...accounts.map(a=>a.opening),...transactions.map(t=>t.amount),...goals.flatMap(g=>[g.target,g.allocated,g.monthly]),...bills.map(b=>b.amount),...budgets.map(b=>b.default_limit),...months.map(m=>m.limit_amount)].reduce((s,v)=>s+(BigInt(v!)<BigInt(0)?-BigInt(v!):BigInt(v!)),BigInt(0));
 if(magnitude>BigInt(Number.MAX_SAFE_INTEGER)/BigInt(4)) throw new AccessError(400,'money_outside_ui_range');
 const categoryCode=(id:string|null)=>categories.find(c=>c.id===id)?.code??'transfer';
 return {asOf:todayKey(),startsOn:current.data!.starts_on,settings:current.data!,categories,
 accounts:accounts.map(a=>({id:a.id!,name:a.name!,opening:number(a.opening),note:a.note!,revision:a.revision!,archivedAt:a.archived_at})),
 transactions:transactions.map(t=>({id:t.id!,revision:t.revision!,date:t.date!,description:t.description!,amount:number(t.amount),kind:t.kind as 'income'|'expense'|'refund'|'transfer',account:t.account_id!,destination:t.destination_account_id??undefined,category:categoryCode(t.category_id),source:t.source as 'csv'|'manual'})),
 budgets:categories.filter(c=>c.kind==='expense').map(c=> {const b=budgets.find(b=>b.category_id===c.id);return {id:c.code,archivedAt:c.archived_at,name:b?.name??c.name,limit:b?number(b.default_limit):0,fixed:b?.fixed??false,resourceId:b?.id??undefined,revision:b?.revision??undefined,categoryId:c.id,monthlyLimits:Object.fromEntries(months.filter(m=>m.budget_id===b?.id).map(m=>[m.month!.slice(0,7),number(m.limit_amount)])),monthRows:months.filter(m=>m.budget_id===b?.id).map(m=>({id:m.id!,month:m.month!,revision:m.revision!}))};}),
 goals:goals.map(g=>({id:g.id!,revision:g.revision!,name:g.name!,target:number(g.target),allocated:number(g.allocated),monthly:number(g.monthly),deadline:g.deadline!,priority:g.priority as 'high'|'normal',visual:g.visual as 'study'})),
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
  const rows=parsed.map(({row},i)=>({id:stableRowId(id,i),date:row.date,description:row.description,amount:String(row.amount),kind:row.kind,account_id:row.account,destination_account_id:row.destination??null,category_id:row.kind==='transfer'?null:data.categories!.find(c=>c.code===row.category)?.id??null}));
  const r=await db.rpc('finance_import',{p_id:id,p_rows:rows}); dbError(r.error); return Response.json({count:r.data});
 }
 if(!resources.includes(resource as Resource)) throw new AccessError(404,'missing');
 const key=resource as Resource,table=`finance_${key}` as Table;
 if(request.method==='GET') {const r=await db.from(table).select('id,revision').eq('owner_id',user.id);dbError(r.error);return Response.json(r.data);}
 const body=await input(request),id=uuid(body.id);
 const values:Record<string,unknown>={};
 for(const field of fields[key]) if(body[field]!==undefined) {
  const value=body[field];
  if(moneyFields.has(field)) values[field]=checkedMoney(value);
  else if(['fixed'].includes(field)) {if(typeof value!=='boolean')throw new AccessError(400,'invalid');values[field]=value;}
  else if(field.endsWith('_id')) values[field]=value===null?null:uuid(value);
  else {
   if(value!==null&&typeof value!=='string')throw new AccessError(400,'invalid');
   if(value===null&&field!=='archived_at')throw new AccessError(400,'invalid');
   if(['date','month','deadline','due_on','starts_on'].includes(field)&&
     (typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value))throw new AccessError(400,'invalid_date');
   values[field]=value;
  }
 }
 if(key==='goals'&&body.image) throw new AccessError(400,'goal_images_require_P08');
 // CAS mutations never accept owner, timestamps, revisions or an entire FinanceData object.
 const perform = async () => {
  switch(key) {
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
 const result=await perform();
 if(request.method==='POST'&&result.error?.code==='23505') {
  const r=await db.from(table).select('id,revision').eq('id',id).eq('owner_id',user.id).maybeSingle();dbError(r.error);if(!r.data) throw new AccessError(409,'conflict');return Response.json(r.data);
 }
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
