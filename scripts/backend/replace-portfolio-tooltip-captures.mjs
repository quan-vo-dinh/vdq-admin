// Replace only selected saved-draft image refs with reviewed official-site captures.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { randomUUID, createHash } from 'node:crypto';
import sharp from 'sharp';
import { parseDocument } from '../../lib/portfolio/model.ts';
import { fingerprint } from '../../lib/portfolio/editor-state.ts';
import { seal, open } from '../data/snapshot.mjs';
import { atomicOutput } from './atomic-output.mjs';
const project='wcgdvsiiemurehkprvqw',key='/Users/vodinhquan/.config/dashboard-backup-recovery/private.pem';
const specs=[
 {id:'editorial-v1-node',file:'/Users/vodinhquan/Downloads/nodejs.org_en.png',source:'https://nodejs.org/en'},
 {id:'editorial-v1-dotnet',file:'/Users/vodinhquan/Downloads/dotnet.microsoft.com_en-us_apps_aspnet.png',source:'https://dotnet.microsoft.com/en-us/apps/aspnet'},
 {id:'editorial-v1-frameworks',file:'/Users/vodinhquan/Downloads/nestjs.com_.png',source:'https://nestjs.com/'},
];
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
function cli(args){return execFileSync('pnpm',['exec','supabase',...args],{stdio:['ignore','pipe','pipe'],maxBuffer:8*1024*1024,timeout:60000}).toString();}
function query(sql){const r=JSON.parse(cli(['db','query','--linked','--project-ref',project,sql]));assert(Array.isArray(r.rows));return r.rows;}
const literal=s=>"'"+s.replaceAll("'","''")+"'";
function capture(){const rows=query("select to_jsonb(s) as site,(select coalesce(jsonb_agg(to_jsonb(v) order by v.id),'[]') from public.portfolio_versions v where v.owner_id=s.owner_id) as versions from public.portfolio_sites s join private.app_owner o on o.user_id=s.owner_id where o.enabled and o.github_user_id='129001260'");assert.equal(rows.length,1);parseDocument(rows[0].site.draft);return rows[0];}
async function backup(label,payload){const business={project,label,...payload};const envelope=seal({schemaVersion:1,datasets:[],portfolioCapture:business},await readFile(key+'.pub'));assert.equal(fingerprint(open(envelope,await readFile(key)).portfolioCapture),fingerprint(business));const file='/Users/vodinhquan/Documents/dashboard-backups/portfolio-editorial/'+new Date().toISOString().replaceAll(':','-')+'-'+label+'.enc.json';atomicOutput(file,JSON.stringify(envelope),{replace:false});return file;}
try{
 const before=capture(),doc=structuredClone(before.site.draft),media=[];
 for(const spec of specs){
  for(const locale of ['vi','en'])assert.equal(doc.locales[locale].annotations?.filter(a=>a.id===spec.id).length,1);
  const input=await readFile(spec.file),meta=await sharp(input).metadata();assert.equal(meta.width,2880);assert.equal(meta.height,1620);
  // Trim only the outer right/bottom edge to exclude the browser extension widget.
  const bytes=await sharp(input).extract({left:0,top:0,width:2780,height:1564}).resize(1440,810).webp({quality:88}).toBuffer();
  assert(bytes.length<2097152);const id=randomUUID(),path=before.site.owner_id+'/portfolio/'+id+'.webp';
  media.push({...spec,id:spec.id,mediaId:id,path,bytes:bytes.length,sha256:hash(bytes),data:bytes.toString('base64')});
  for(const locale of ['vi','en'])doc.locales[locale].annotations.find(a=>a.id===spec.id).image='media:'+id;
 }
 parseDocument(doc);
 const stripped=structuredClone(doc);for(const locale of ['vi','en'])for(const spec of specs)stripped.locales[locale].annotations.find(a=>a.id===spec.id).image=before.site.draft.locales[locale].annotations.find(a=>a.id===spec.id).image;
 assert.equal(fingerprint(stripped),fingerprint(before.site.draft));
 const preparedBackup=await backup('official-captures-prepared',{before,document:doc,media});
 if(!process.argv.includes('--apply')){console.log(JSON.stringify({mode:'plan',revision:before.site.revision,images:media.map(({id,source,bytes,sha256})=>({id,source,bytes,sha256})),backup:preparedBackup}));process.exit(0);}
 assert.equal(fingerprint(capture()),fingerprint(before),'Draft changed while preparing images');
 const response=JSON.parse(cli(['projects','api-keys','--project-ref',project,'-o','json']));const service=(Array.isArray(response)?response:response.api_keys)?.find(x=>x.name==='service_role')?.api_key;assert(service?.startsWith('eyJ'));
 for(const m of media){const r=await fetch(`https://${project}.supabase.co/storage/v1/object/portfolio-media/${m.path}`,{method:'POST',headers:{apikey:service,Authorization:'Bearer '+service,'Content-Type':'image/webp','x-upsert':'false'},body:Buffer.from(m.data,'base64'),signal:AbortSignal.timeout(20000)});assert(r.ok,`Upload failed ${r.status}`);}
 const inserts=media.map(m=>`insert into public.portfolio_media(id,path,mime,bytes) values(${literal(m.mediaId)}::uuid,${literal(m.path)},'image/webp',${m.bytes});`).join('\n');
 query(`begin;set local role authenticated;select set_config('request.jwt.claim.sub',${literal(before.site.owner_id)},true);${inserts}select revision from public.save_portfolio(${literal(JSON.stringify(doc))}::jsonb,${before.site.revision});commit;select true as saved;`);
 const after=capture();assert.equal(after.site.revision,before.site.revision+1);assert.equal(fingerprint(after.site.draft),fingerprint(doc));assert.equal(fingerprint(after.versions),fingerprint(before.versions));assert.equal(after.site.published_id,before.site.published_id);
 for(const m of media){const r=await fetch(`https://${project}.supabase.co/storage/v1/object/authenticated/portfolio-media/${m.path}`,{headers:{apikey:service,Authorization:'Bearer '+service},signal:AbortSignal.timeout(20000)});assert(r.ok);assert.equal(hash(Buffer.from(await r.arrayBuffer())),m.sha256);const publicResponse=await fetch(`https://vdq-admin.vercel.app/api/portfolio/public/media/${m.mediaId}`);assert.equal(publicResponse.status,404);}
 const afterBackup=await backup('official-captures-after',{after,media});
 console.log(JSON.stringify({result:'PASS',revision:after.site.revision,imagesReplaced:media.length,localizedRefsReplaced:6,originalTextUnchanged:true,publicationUnchanged:true,privateImagesVerified:true,preparedBackup,afterBackup}));
}catch{console.error('Screenshot replacement stopped; inspect encrypted checkpoint/readback before retrying. No credentials logged.');process.exitCode=1;}
