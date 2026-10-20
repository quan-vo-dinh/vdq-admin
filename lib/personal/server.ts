import 'server-only';
import { requireOwner } from '@/lib/auth/owner';
import { AccessError } from '@/lib/auth/policy';
import type { Database } from '@/types/database';
import { dbError, input, revision } from '@/lib/backend/mutations';
const personalKeys = ['firstName','lastName','email','phone','position','facebook','linkedin','github','instagram'];
const addressKeys = ['location','state','pin','zip','taxNo'];
function fields(value: unknown, keys: string[]) {
 if(!value || typeof value !== 'object' || Array.isArray(value)) throw new AccessError(400,'invalid');
 const entries=Object.entries(value);
 if(entries.some(([k,v])=>!keys.includes(k)||typeof v!=='string'||v.length>500)) throw new AccessError(400,'invalid');
 for(const [k,v] of entries) {
  if(['facebook','linkedin','github','instagram'].includes(k) && v) {try {const u=new URL(String(v));if(!['http:','https:'].includes(u.protocol)||u.username||u.password)throw new Error();}catch{throw new AccessError(400,'invalid_url');}}
  if(k==='email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v)))throw new AccessError(400,'invalid_email');
 }
 return Object.fromEntries(entries) as Record<string,string>;
}
export async function personalRequest(request: Request, kind: 'profiles'|'user_preferences') {
 const {supabase:db,user}=await requireOwner();
 const existing=await db.from(kind).select().eq('owner_id',user.id).maybeSingle();dbError(existing.error);
 if(!existing.data) {const r=await db.from(kind).insert({id:user.id});if(r.error?.code!=='23505')dbError(r.error);}
 if(request.method==='GET') {const r=await db.from(kind).select().eq('owner_id',user.id).single();dbError(r.error);return Response.json(r.data);}
 const body=await input(request),expected=revision(body.expectedRevision);
 const values:Record<string,unknown>={};
 if(kind==='profiles') {if(body.personal!==undefined)values.personal=fields(body.personal,personalKeys);if(body.address!==undefined)values.address=fields(body.address,addressKeys);}
 else {if(body.locale!==undefined){if(!['vi','en'].includes(String(body.locale)))throw new AccessError(400,'invalid');values.locale=body.locale;}if(body.theme!==undefined){if(!['light','dark'].includes(String(body.theme)))throw new AccessError(400,'invalid');values.theme=body.theme;}}
 if(!Object.keys(values).length)throw new AccessError(400,'invalid');
 const r=await db.from(kind).update(values as Database['public']['Tables'][typeof kind]['Update']).eq('owner_id',user.id).eq('revision',expected).select().maybeSingle();dbError(r.error);
 if(!r.data)throw new AccessError(409,'conflict');return Response.json(r.data);
}
