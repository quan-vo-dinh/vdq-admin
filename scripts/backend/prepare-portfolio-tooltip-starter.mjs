// Explicit owner-authorized editorial tool. Default is read-only planning; --apply saves a draft only.
// Hosted credentials stay in process memory. No public content, code schema or permissions are changed.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { randomUUID, createHash } from 'node:crypto';
import sharp from 'sharp';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Markdown from 'react-markdown';
import { siDotnet, siNodedotjs, siNextdotjs, siNestjs } from 'simple-icons';
import { parseDocument } from '../../lib/portfolio/model.ts';
import { annotationText, annotationRanges, annotationRemark } from '../../lib/portfolio/annotations.ts';
import { fingerprint } from '../../lib/portfolio/editor-state.ts';
import { tooltipStarter } from '../data/portfolio-tooltip-starter.mjs';
import { seal, open } from '../data/snapshot.mjs';
import { atomicOutput } from './atomic-output.mjs';
const project='wcgdvsiiemurehkprvqw', github='129001260', apply=process.argv.includes('--apply');
const backupDirectory='/Users/vodinhquan/Documents/dashboard-backups/portfolio-editorial';
const recovery='/Users/vodinhquan/.config/dashboard-backup-recovery/private.pem';
const digest = value => createHash('sha256').update(Buffer.isBuffer(value)?value:typeof value==='string'?value:JSON.stringify(value)).digest('hex');
function cli(args) { return execFileSync('pnpm',['exec','supabase',...args],{stdio:['ignore','pipe','pipe'],maxBuffer:8*1024*1024,timeout:60000}).toString(); }
function query(sql) { const result=JSON.parse(cli(['db','query','--linked','--project-ref',project,sql])); assert(Array.isArray(result.rows));return result.rows; }
function literal(value) { return "'"+value.replaceAll("'","''")+"'"; }
function capture() {
  const rows=query(`select to_jsonb(s) as site,(select coalesce(jsonb_agg(to_jsonb(v) order by v.id),'[]') from public.portfolio_versions v where v.owner_id=s.owner_id) as versions,(select count(*)::int from public.portfolio_media m where m.owner_id=s.owner_id) as media_count from public.portfolio_sites s join private.app_owner o on o.user_id=s.owner_id where o.enabled and o.github_user_id='${github}'`);
  assert.equal(rows.length,1,'Expected the verified singleton owner');parseDocument(rows[0].site.draft);return rows[0];
}
const stripAnnotations = doc => { const next=structuredClone(doc);for(const locale of ['vi','en'])delete next.locales[locale].annotations;return next; };
const covers={
  dotnet:{title:'C# / ASP.NET Core',subtitle:'The .NET ecosystem',color:'#a78bfa',icons:[siDotnet]},
  node:{title:'Node.js',subtitle:'JavaScript beyond the browser',color:'#8bd46c',icons:[siNodedotjs]},
  frameworks:{title:'Next.js + NestJS',subtitle:'Web applications / Backend services',color:'#fda4af',icons:[siNextdotjs,siNestjs]},
};
function coverSvg(config) {
  const logos=config.icons.map((icon,i)=>`<g transform="translate(${60+i*105},50) scale(3.2)" fill="${config.color}"><path d="${icon.path}"/></g>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540"><defs><radialGradient id="glow"><stop stop-color="${config.color}" stop-opacity=".16"/><stop offset="1" stop-color="${config.color}" stop-opacity="0"/></radialGradient></defs><rect width="960" height="540" fill="#111316"/><circle cx="800" cy="80" r="460" fill="url(#glow)"/><path d="M60 170H900" stroke="#30343b"/>${logos}<text x="60" y="270" fill="#9ca3af" font-family="sans-serif" font-size="18" letter-spacing="4">TECHNOLOGY NOTE</text><text x="56" y="355" fill="#f9fafb" font-family="sans-serif" font-size="58" font-weight="700">${config.title}</text><text x="60" y="408" fill="#b9c0ca" font-family="sans-serif" font-size="25">${config.subtitle}</text><path d="M60 480h50" stroke="${config.color}" stroke-width="5"/><text x="128" y="487" fill="#8c949f" font-family="sans-serif" font-size="18">Vo Dinh Quan / Portfolio</text></svg>`;
}
function plan(source, images) {
  const document=structuredClone(source), added=[], skipped=[];
  for (const locale of ['vi','en']) {
    const resume=document.locales[locale], existing=resume.annotations??[], next=[...existing];
    for (const spec of tooltipStarter) {
      const itemId=spec.itemId??'',quote=spec.quote[locale],text=annotationText(resume,spec.field,itemId);
      const key=`editorial-v1-${spec.key}`;
      if (existing.some(a=>a.id===key || a.field===spec.field&&a.itemId===itemId&&a.quote===quote&&a.occurrence===1)) {skipped.push({locale,key,reason:'already-configured'});continue;}
      if (!text.includes(quote)) { skipped.push({locale,key,reason:'phrase-missing'});continue; }
      const related=next.filter(a=>a.field===spec.field&&a.itemId===itemId);
      const projectItem=spec.projectImage?resume.projects.find(p=>p.id===itemId):null;
      const annotation={id:key,field:spec.field,itemId,quote,occurrence:1,title:spec.title[locale],body:spec.body[locale],image:spec.cover?images[spec.cover]:projectItem?.image??'',href:spec.projectHref?projectItem?.href??'':spec.href??'',appearance:spec.appearance,enabled:true};
      const rendered=annotationRanges(text,[...related,annotation]);
      if(!rendered.some(r=>r.annotation.id===key)||related.some(a=>!rendered.some(r=>r.annotation.id===a.id)&&annotationRanges(text,[a]).length)) {skipped.push({locale,key,reason:'overlaps-existing'});continue;}
      const html=renderToStaticMarkup(React.createElement(Markdown,{skipHtml:true,remarkPlugins:[annotationRemark(text,[annotation])]},text));
      assert(html.includes(`data-portfolio-annotation="${key}"`),`Unrenderable annotation: ${locale}/${key}`);
      next.push(annotation);added.push({locale,id:key,field:spec.field,itemId,quote,title:annotation.title,cover:spec.cover??null});
    }
    if(next.length)resume.annotations=next;
  }
  parseDocument(document);
  assert.equal(fingerprint(stripAnnotations(document)),fingerprint(stripAnnotations(source)),'Original content must stay unchanged');
  return {document,added,skipped};
}
async function encryptedCheckpoint(label,payload) {
  const envelope=seal({schemaVersion:1,datasets:[],portfolioEditorial:{project,label,at:new Date().toISOString(),...payload}},await readFile(recovery+'.pub'));
  const file=backupDirectory+'/'+new Date().toISOString().replaceAll(':','-')+'-'+label+'.enc.json';
  atomicOutput(file,JSON.stringify(envelope),{replace:false});
  const restored=open(envelope,await readFile(recovery));
  assert.equal(fingerprint(restored.portfolioEditorial),fingerprint({project,label,at:restored.portfolioEditorial.at,...payload}));
  return file;
}
try {
  const before=capture();
  const placeholders=Object.fromEntries(Object.keys(covers).map(k=>[k,'media:00000000-0000-4000-8000-000000000000']));
  const proposed=plan(before.site.draft,placeholders);
  await mkdir('/tmp/portfolio-tooltip-covers',{recursive:true,mode:0o700});
  const prepared={};
  for(const key of new Set(proposed.added.map(a=>a.cover).filter(Boolean))) {
    const bytes=await sharp(Buffer.from(coverSvg(covers[key]))).webp({quality:90}).toBuffer();
    assert(bytes.length<=2097152);await writeFile(`/tmp/portfolio-tooltip-covers/${key}.webp`,bytes,{mode:0o600});prepared[key]=bytes;
  }
  if(!apply || !proposed.added.length) {
    console.log(JSON.stringify({mode:'read-only-plan',project,revision:before.site.revision,additions:proposed.added,skipped:proposed.skipped,originalTextUnchanged:true,coverPreviews:Object.keys(prepared).map(k=>`/tmp/portfolio-tooltip-covers/${k}.webp`)},null,2));
  } else {
    const backup=await encryptedCheckpoint('before',{snapshot:before});
    const latest=capture();assert.equal(fingerprint(latest),fingerprint(before),'Concurrent content change; re-plan');
    const response=JSON.parse(cli(['projects','api-keys','--project-ref',project,'-o','json']));
    const service=(Array.isArray(response)?response:response.api_keys)?.find(k=>k.name==='service_role')?.api_key;
    assert(service?.startsWith('eyJ'),'Hosted media tooling unavailable');
    const media=[];const images={};
    for(const [key,bytes] of Object.entries(prepared)) {
      const id=randomUUID(),path=before.site.owner_id+'/portfolio/'+id+'.webp';
      const result=await fetch(`https://${project}.supabase.co/storage/v1/object/portfolio-media/${path}`,{method:'POST',headers:{apikey:service,Authorization:'Bearer '+service,'Content-Type':'image/webp','x-upsert':'false'},body:bytes,signal:AbortSignal.timeout(20000)});
      assert(result.ok,`Private image upload failed (${result.status})`);
      media.push({id,path,mime:'image/webp',bytes:bytes.length,cover:key,sha256:digest(bytes),data:bytes.toString('base64')});images[key]='media:'+id;
    }
    const operation=plan(before.site.draft,images);
    const checkpoint=await encryptedCheckpoint('prepared',{snapshot:before,document:operation.document,media});
    const registration=media.map(m=>`insert into public.portfolio_media(id,path,mime,bytes) values(${literal(m.id)}::uuid,${literal(m.path)},'image/webp',${m.bytes});`).join('\n');
    const result=query(`begin;set local role authenticated;select set_config('request.jwt.claim.sub',${literal(before.site.owner_id)},true);${registration}select revision,published_id from public.save_portfolio(${literal(JSON.stringify(operation.document))}::jsonb,${before.site.revision});commit;select 'draft_saved' as status;`);
    const after=capture();
    assert.equal(after.site.revision,before.site.revision+1);assert.equal(after.site.published_id,before.site.published_id);assert.equal(fingerprint(after.versions),fingerprint(before.versions));
    assert.equal(fingerprint(after.site.draft),fingerprint(operation.document));assert.equal(fingerprint(stripAnnotations(after.site.draft)),fingerprint(stripAnnotations(before.site.draft)));assert.equal(after.media_count,before.media_count+media.length);
    const checks=query(`select private.validate_portfolio(draft,owner_id) as valid,(select count(*)::int from public.portfolio_versions v where v.owner_id=s.owner_id) as publications,(select count(*)::int from public.portfolio_media m where m.owner_id=s.owner_id and m.id=any(array[${media.map(m=>literal(m.id)+'::uuid').join(',')}]::uuid[]) and exists(select 1 from public.read_published_portfolio_media(m.id))) as new_images_public from public.portfolio_sites s where s.owner_id=${literal(before.site.owner_id)}::uuid`);
    assert.equal(checks[0].valid,true);assert.equal(checks[0].new_images_public,0);
    for(const m of media) {
      const r=await fetch(`https://${project}.supabase.co/storage/v1/object/authenticated/portfolio-media/${m.path}`,{headers:{apikey:service,Authorization:'Bearer '+service},signal:AbortSignal.timeout(20000)});
      assert(r.ok);assert.equal(digest(Buffer.from(await r.arrayBuffer())),m.sha256);
    }
    const afterBackup=await encryptedCheckpoint('after',{snapshot:after,media});
    console.log(JSON.stringify({result:'PASS',project,revisionBefore:before.site.revision,revisionAfter:after.site.revision,added:Object.fromEntries(['vi','en'].map(l=>[l,operation.added.filter(a=>a.locale===l).length])),newPrivateImages:media.length,originalTextUnchanged:true,publishedVersionUnchanged:true,newImagesPublic:false,checks,encryptedBackups:[backup,checkpoint,afterBackup],sqlResultRows:result.length},null,2));
  }
} catch { console.error('Portfolio editorial operation stopped. No credentials logged. Inspect scoped backup/readback before retrying; do not overwrite newer drafts.');process.exitCode=1; }
