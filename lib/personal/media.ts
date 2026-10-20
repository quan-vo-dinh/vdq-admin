import 'server-only';
import sharp from 'sharp';
import { requireOwner } from '@/lib/auth/owner';
import { AccessError } from '@/lib/auth/policy';
import { dbError, revision, uuid } from '@/lib/backend/mutations';
export const bucket = 'personal-media';
const max=2*1024*1024;
export async function goalImageRequest(request: Request) {
 const {supabase:db,user}=await requireOwner();
 const url=new URL(request.url),id=uuid(url.searchParams.get('id'));
 const current=await db.from('finance_goals').select('image_path,revision').eq('id',id).eq('owner_id',user.id).maybeSingle();dbError(current.error);
 if(!current.data)throw new AccessError(404,'missing');
 const old=current.data.image_path;
 if(request.method==='GET') {
  if(!old)return Response.json({url:null,expiresIn:120});
  const r=await db.storage.from(bucket).createSignedUrl(old,120);if(r.error)throw new AccessError(503,'image_unavailable');
  return Response.json({url:r.data.signedUrl,expiresIn:120});
 }
 const expected=revision(Number(url.searchParams.get('revision')));
 if(current.data.revision!==expected)throw new AccessError(409,'conflict');
 let path:string|null=null;
 if(request.method==='POST') {
  if(Number(request.headers.get('content-length'))>max)throw new AccessError(413,'image_too_large');
  // Bounded stream: stop before buffering an arbitrarily large or chunked upload.
  const reader=request.body?.getReader();if(!reader)throw new AccessError(400,'invalid_image');
  const chunks:Uint8Array[]=[];let size=0;
  while(true){const r=await reader.read();if(r.done)break;size+=r.value.length;if(size>max){await reader.cancel();throw new AccessError(413,'image_too_large');}chunks.push(r.value);}
  const bytes=Buffer.concat(chunks);let encoded:Buffer;
  try {
   const image=sharp(bytes,{limitInputPixels:16_000_000,animated:false,failOn:'warning'});const meta=await image.metadata();
   const mime=({jpeg:'image/jpeg',png:'image/png',webp:'image/webp'} as Record<string,string>)[meta.format??''];
   if(!mime||request.headers.get('content-type')!==mime||(meta.pages??1)>1)throw new Error();
   // Decode/re-encode removes metadata and verifies actual pixels before attach.
   encoded=await image.rotate().webp({quality:85}).toBuffer();
   if(encoded.length>max)throw new Error();
  }catch{throw new AccessError(400,'invalid_image');}
  path=`${user.id}/goals/${crypto.randomUUID()}.webp`;
  const r=await db.storage.from(bucket).upload(path,encoded,{contentType:'image/webp',upsert:false,cacheControl:'0'});
  if(r.error)throw new AccessError(503,'image_upload_failed');
 }
 const attached=await db.from('finance_goals').update({image_path:path}).eq('id',id).eq('owner_id',user.id).eq('revision',expected).select('id,revision').maybeSingle();
 async function cleanup(name:string) {const r=await db.storage.from(bucket).remove([name]);if(r.error)console.error('personal_media_cleanup_required',name);return !r.error;}
 if(attached.error||!attached.data) {if(path)await cleanup(path);dbError(attached.error);throw new AccessError(409,'conflict');}
 const cleanupPending=old?!await cleanup(old):false;
 return Response.json({...attached.data,cleanupPending});
}
