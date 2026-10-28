// Explicit local recovery only. No deletion: register validated immutable orphan uploads.
import { localDomainSession } from './local-domain-session.mjs';
import sharp from 'sharp';
const {sql,status,owner}=localDomainSession();
const paths=JSON.parse(sql(`select coalesce(json_agg(name),'[]') from storage.objects o where bucket_id='portfolio-media' and name like '${owner}/portfolio/%' and not exists(select 1 from public.portfolio_media m where m.path=o.name)`));
let registered=0;
for(const path of paths){if(!new RegExp(`^${owner}/portfolio/[0-9a-f-]{36}\\.webp$`).test(path))throw new Error('Unexpected orphan path');const r=await fetch(status.API_URL+'/storage/v1/object/authenticated/portfolio-media/'+path,{headers:{apikey:status.SERVICE_ROLE_KEY,Authorization:'Bearer '+status.SERVICE_ROLE_KEY}});if(!r.ok)throw new Error('Orphan unavailable');const bytes=Buffer.from(await r.arrayBuffer()),m=await sharp(bytes,{limitInputPixels:16_000_000}).metadata();if(m.format!=='webp'||bytes.length>2097152)throw new Error('Invalid orphan');const id=path.split('/').at(-1).slice(0,-5);sql(`insert into public.portfolio_media(id,owner_id,path,mime,bytes) values('${id}','${owner}','${path}','image/webp',${bytes.length}) on conflict do nothing`);registered++;}
console.log(JSON.stringify({registered,deleted:0,target:'local'}));
