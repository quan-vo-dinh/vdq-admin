// Owner-requested content edit; read-only by default. --apply saves and publishes
// just this split after a verified encrypted checkpoint and owner revision check.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { randomUUID, createHash } from 'node:crypto';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Markdown from 'react-markdown';
import sharp from 'sharp';
import { parseDocument } from '../../lib/portfolio/model.ts';
import { fingerprint } from '../../lib/portfolio/editor-state.ts';
import { annotationText, annotationRemark } from '../../lib/portfolio/annotations.ts';
import { splitFrameworkTooltips } from '../data/portfolio-framework-tooltips.mjs';
import { seal, open } from '../data/snapshot.mjs';
import { atomicOutput } from './atomic-output.mjs';

const project='wcgdvsiiemurehkprvqw', key='/Users/vodinhquan/.config/dashboard-backup-recovery/private.pem';
const literal=s=>"'"+s.replaceAll("'","''")+"'";
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
function cli(args){return execFileSync('pnpm',['exec','supabase',...args],{stdio:['ignore','pipe','pipe'],maxBuffer:8*1024*1024,timeout:60000}).toString();}
function query(sql){const result=JSON.parse(cli(['db','query','--linked','--project-ref',project,sql]));assert(Array.isArray(result.rows));return result.rows;}
function capture(){
  const rows=query("select to_jsonb(s) as site,(select coalesce(jsonb_agg(to_jsonb(v) order by v.id),'[]') from public.portfolio_versions v where v.owner_id=s.owner_id) as versions,(select coalesce(jsonb_agg(to_jsonb(m) order by m.id),'[]') from public.portfolio_media m where m.owner_id=s.owner_id) as media from public.portfolio_sites s join private.app_owner o on o.user_id=s.owner_id where o.enabled and o.github_user_id='129001260'");
  assert.equal(rows.length,1);parseDocument(rows[0].site.draft);return rows[0];
}
async function backup(label,payload){
  const value={project,label,...payload}, envelope=seal({schemaVersion:1,datasets:[],frameworkSplit:value},await readFile(key+'.pub'));
  assert.equal(fingerprint(open(envelope,await readFile(key)).frameworkSplit),fingerprint(value));
  const file='/Users/vodinhquan/Documents/dashboard-backups/portfolio-editorial/'+new Date().toISOString().replaceAll(':','-')+'-'+label+'.enc.json';
  atomicOutput(file,JSON.stringify(envelope),{replace:false});return file;
}
function validate(original,doc){
  parseDocument(doc);
  const stripped=structuredClone(doc);
  for(const locale of ['vi','en']){
    const notes=doc.locales[locale].annotations;
    stripped.locales[locale].annotations=original.locales[locale].annotations;
    assert.equal(fingerprint(notes.filter(n=>!n.id.startsWith('editorial-v3-'))),fingerprint(original.locales[locale].annotations.filter(n=>n.id!=='editorial-v1-frameworks')));
    assert.equal(notes.length,original.locales[locale].annotations.length+1);
    for(const name of ['nextjs','nestjs'])assert.equal(notes.filter(n=>n.id==='editorial-v3-'+name).length,1);
    assert(!notes.some(n=>n.id==='editorial-v1-frameworks'));
    for(const note of notes.filter(n=>n.enabled)){
      const source=annotationText(doc.locales[locale],note.field,note.itemId);
      const related=notes.filter(n=>n.enabled&&n.field===note.field&&n.itemId===note.itemId);
      const html=renderToStaticMarkup(React.createElement(Markdown,{skipHtml:true,remarkPlugins:[annotationRemark(source,related)]},source));
      assert(html.includes(`data-portfolio-annotation="${note.id}"`),`Tooltip missing: ${locale}/${note.id}`);
    }
  }
  assert.equal(fingerprint(stripped),fingerprint(original),'Unrelated text or content changed');
}
try{
  const before=capture(), published=before.versions.find(v=>v.id===before.site.published_id);
  assert(published);assert.equal(fingerprint(before.site.draft),fingerprint(published.document),'Unpublished changes require a scoped merge');
  if(['vi','en'].every(l=>before.site.draft.locales[l].annotations.some(n=>n.id==='editorial-v3-nextjs')&&!before.site.draft.locales[l].annotations.some(n=>n.id==='editorial-v1-frameworks'))){console.log(JSON.stringify({result:'already-separated',revision:before.site.revision}));process.exit(0);}
  const input=await readFile('/Users/vodinhquan/Downloads/nextjs.org_.png'), meta=await sharp(input).metadata();
  assert.equal(meta.width,2880);assert.equal(meta.height,1620);
  const bytes=await sharp(input).extract({left:0,top:0,width:2780,height:1564}).resize(1440,810).webp({quality:88}).toBuffer();
  assert(bytes.length<2097152);
  const id=randomUUID(),path=before.site.owner_id+'/portfolio/'+id+'.webp';
  const doc=splitFrameworkTooltips(before.site.draft,'media:'+id);validate(before.site.draft,doc);
  const report={revision:before.site.revision,tooltips:Object.fromEntries(['vi','en'].map(l=>[l,doc.locales[l].annotations.length])),newImageBytes:bytes.length,source:'https://nextjs.org/',unrelatedContentUnchanged:true};
  if(!process.argv.includes('--apply')){console.log(JSON.stringify({mode:'read-only-plan',...report}));process.exit(0);}
  const beforeBackup=await backup('framework-split-before',{before,proposed:doc,media:{id,path,sha256:digest(bytes),data:bytes.toString('base64')}});
  assert.equal(fingerprint(capture()),fingerprint(before),'Concurrent edits; stop before publication');
  const keys=JSON.parse(cli(['projects','api-keys','--project-ref',project,'-o','json']));
  const service=(Array.isArray(keys)?keys:keys.api_keys)?.find(k=>k.name==='service_role')?.api_key;assert(service?.startsWith('eyJ'));
  const headers={apikey:service,Authorization:'Bearer '+service};
  const upload=await fetch(`https://${project}.supabase.co/storage/v1/object/portfolio-media/${path}`,{method:'POST',headers:{...headers,'Content-Type':'image/webp','x-upsert':'false'},body:bytes,signal:AbortSignal.timeout(20000)});assert(upload.ok);
  const stored=await fetch(`https://${project}.supabase.co/storage/v1/object/authenticated/portfolio-media/${path}`,{headers,signal:AbortSignal.timeout(20000)});assert(stored.ok);assert.equal(digest(Buffer.from(await stored.arrayBuffer())),digest(bytes));
  assert.equal(fingerprint(capture()),fingerprint(before),'Concurrent edits; stop before publication');
  query(`begin;set local role authenticated;select set_config('request.jwt.claim.sub',${literal(before.site.owner_id)},true);insert into public.portfolio_media(id,path,mime,bytes) values(${literal(id)}::uuid,${literal(path)},'image/webp',${bytes.length});select revision from public.save_portfolio(${literal(JSON.stringify(doc))}::jsonb,${before.site.revision});select id from public.publish_portfolio(${before.site.revision+1});commit;select true as published;`);
  const after=capture(),current=after.versions.find(v=>v.id===after.site.published_id);
  assert(current);assert.equal(fingerprint(current.document),fingerprint(doc));assert.equal(fingerprint(after.site.draft),fingerprint(doc));assert.equal(after.site.revision,before.site.revision+2);
  assert.equal(fingerprint(after.versions.filter(v=>v.id!==current.id)),fingerprint(before.versions));
  assert.equal(fingerprint(after.media.filter(m=>m.id!==id)),fingerprint(before.media));assert.equal(after.media.length,before.media.length+1);
  validate(before.site.draft,after.site.draft);
  const afterBackup=await backup('framework-split-after',{after});
  console.log(JSON.stringify({result:'PASS',...report,revision:after.site.revision,version:current.id,nextImage:'media:'+id,published:true,previousVersionsRetained:true,beforeBackup,afterBackup}));
}catch(error){console.error(error instanceof assert.AssertionError?error.message:'Framework split stopped; inspect encrypted checkpoint/readback before retrying. No credentials logged.');process.exitCode=1;}
