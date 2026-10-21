import 'server-only';
import { requireOwner } from '@/lib/auth/owner';
import { AccessError } from '@/lib/auth/policy';
import type { Database } from '@/types/database';
import { dbError, input, revision } from '@/lib/backend/mutations';
import { profileFields, personalKeys, addressKeys } from './validation';
export async function personalRequest(request: Request, kind: 'profiles'|'user_preferences') {
 const {supabase:db,user}=await requireOwner();
 const existing=await db.from(kind).select().eq('owner_id',user.id).maybeSingle();dbError(existing.error);
 if(!existing.data) {const r=await db.from(kind).insert({id:user.id});if(r.error?.code!=='23505')dbError(r.error);}
 if(request.method==='GET') {const r=await db.from(kind).select().eq('owner_id',user.id).single();dbError(r.error);return Response.json(r.data);}
 const body=await input(request),expected=revision(body.expectedRevision);
 const values:Record<string,unknown>={};
 const stored=existing.data && 'personal' in existing.data ? existing.data : undefined;
 if(kind==='profiles') {if(body.personal!==undefined)values.personal={...(stored?.personal as Record<string,string> ?? {}),...profileFields(body.personal,personalKeys)};if(body.address!==undefined)values.address={...(stored?.address as Record<string,string> ?? {}),...profileFields(body.address,addressKeys)};}
 else {if(body.locale!==undefined){if(!['vi','en'].includes(String(body.locale)))throw new AccessError(400,'invalid');values.locale=body.locale;}if(body.theme!==undefined){if(!['light','dark'].includes(String(body.theme)))throw new AccessError(400,'invalid');values.theme=body.theme;}}
 if(!Object.keys(values).length)throw new AccessError(400,'invalid');
 const r=await db.from(kind).update(values as Database['public']['Tables'][typeof kind]['Update']).eq('owner_id',user.id).eq('revision',expected).select().maybeSingle();dbError(r.error);
 if(!r.data)throw new AccessError(409,'conflict');return Response.json(r.data);
}
