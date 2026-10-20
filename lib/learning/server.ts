import 'server-only';
import { requireOwner } from '@/lib/auth/owner';
import { AccessError } from '@/lib/auth/policy';
import { dbError,input,revision,uuid } from '@/lib/backend/mutations';
import { todayKey } from './model';
function text(value:unknown,max:number,required=false) {if(typeof value!=='string'||value.trim().length>max||(required&&!value.trim()))throw new AccessError(400,'invalid');return value.trim();}
export async function learningRequest(request:Request,resource:'habits'|'checkins') {
 const {supabase:db,user}=await requireOwner();
 if(request.method!=='GET') {
  const body=await input(request),id=uuid(body.id);
  if(resource==='habits') {
   const values={...(body.title!==undefined&&{title:text(body.title,80,true)}),...(body.intention!==undefined&&{intention:text(body.intention,240)}),...(body.minutes!==undefined&&{target_minutes:Number(body.minutes)}),...(body.archived!==undefined&&{archived:body.archived as boolean})};
   if(body.archived!==undefined&&typeof body.archived!=='boolean')throw new AccessError(400,'invalid');
   if((request.method==='POST'||body.minutes!==undefined)&&(!Number.isInteger(body.minutes)||Number(body.minutes)<1||Number(body.minutes)>1440))throw new AccessError(400,'invalid');
   const result=request.method==='POST'?await db.from('learning_habits').insert({id,title:text(body.title,80,true),target_minutes:Number(body.minutes),intention:text(body.intention,240)}).select():await db.from('learning_habits').update(values).eq('id',id).eq('owner_id',user.id).eq('revision',revision(body.expectedRevision)).select();
   if(!(request.method==='POST'&&result.error?.code==='23505')) {dbError(result.error);if(!result.data?.length)throw new AccessError(409,'conflict');}
  } else {
   if(!Number.isInteger(body.expectedRevision)||Number(body.expectedRevision)<0)throw new AccessError(400,'invalid_revision');
   if(!Number.isInteger(body.minutes)||Number(body.minutes)<1||Number(body.minutes)>1440) throw new AccessError(400,'invalid');
   const r=await db.rpc('learning_checkin',{p_habit:uuid(body.habitId),p_id:id,p_revision:Number(body.expectedRevision),p_date:text(body.date,10),p_minutes:Number(body.minutes),p_note:text(body.note,500),p_undo:request.method==='DELETE'});dbError(r.error);
  }
 }
 const habits=await db.from('learning_habits').select().eq('owner_id',user.id).order('created_at');dbError(habits.error);
 const entries: import("@/types/database").Database["public"]["Tables"]["learning_checkins"]["Row"][]=[];for(let from=0;;from+=500){const r=await db.from('learning_checkins').select().eq('owner_id',user.id).order('id').range(from,from+499);dbError(r.error);entries.push(...r.data!);if(r.data!.length<500)break;}
 return Response.json({version:1,today:todayKey(),habits:habits.data!.map(h=>({id:h.id,revision:h.revision,title:h.title,intention:h.intention,minutes:h.target_minutes,created:h.started_on,archived:h.archived,entries:entries.filter(e=>e.habit_id===h.id).map(e=>({id:e.id,revision:e.revision,date:e.checked_on,minutes:e.minutes,note:e.note}))}))},{status:request.method==='POST'?201:200});
}
