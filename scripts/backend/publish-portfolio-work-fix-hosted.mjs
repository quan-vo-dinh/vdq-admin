// Explicit owner instruction: correct the VI .NET version and publish the reviewed saved draft.
// Default is read-only; --apply invokes owner CAS save + publish atomically after encrypted backup.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import Markdown from 'react-markdown';
import {parseDocument} from '../../lib/portfolio/model.ts';
import {fingerprint} from '../../lib/portfolio/editor-state.ts';
import {annotationText,annotationRemark} from '../../lib/portfolio/annotations.ts';
import {seal,open} from '../data/snapshot.mjs';
import {atomicOutput} from './atomic-output.mjs';
const project='wcgdvsiiemurehkprvqw',key='/Users/vodinhquan/.config/dashboard-backup-recovery/private.pem';
const literal=s=>"'"+s.replaceAll("'","''")+"'";
function query(sql){const r=JSON.parse(execFileSync('pnpm',['exec','supabase','db','query','--linked','--project-ref',project,sql],{stdio:['ignore','pipe','pipe'],maxBuffer:8*1024*1024,timeout:60000}).toString());assert(Array.isArray(r.rows));return r.rows;}
function capture(){const rows=query("select to_jsonb(s) as site,(select coalesce(jsonb_agg(to_jsonb(v) order by v.id),'[]') from public.portfolio_versions v where v.owner_id=s.owner_id) as versions,(select coalesce(jsonb_agg(to_jsonb(m) order by m.id),'[]') from public.portfolio_media m where m.owner_id=s.owner_id) as media from public.portfolio_sites s join private.app_owner o on o.user_id=s.owner_id where o.enabled and o.github_user_id='129001260'");assert.equal(rows.length,1);parseDocument(rows[0].site.draft);return rows[0];}
async function backup(label,payload){const value={project,label,...payload},envelope=seal({schemaVersion:1,datasets:[],portfolioPublish:value},await readFile(key+'.pub'));assert.equal(fingerprint(open(envelope,await readFile(key)).portfolioPublish),fingerprint(value));const file='/Users/vodinhquan/Documents/dashboard-backups/portfolio-editorial/'+new Date().toISOString().replaceAll(':','-')+'-'+label+'.enc.json';atomicOutput(file,JSON.stringify(envelope),{replace:false});return file;}
try{
 const before=capture(),doc=structuredClone(before.site.draft);
 const work=doc.locales.vi.work.find(w=>w.id==='work-0'&&w.company==='i-Soft');assert(work);
 work.description=work.description.replace('ASP.NET Core/.NET 8 & 10.','ASP.NET Core/.NET 8.');
 const restored=structuredClone(doc);restored.locales.vi.work.find(w=>w.id==='work-0').description=before.site.draft.locales.vi.work.find(w=>w.id==='work-0').description;
 assert.equal(fingerprint(restored),fingerprint(before.site.draft));parseDocument(doc);
 let notes=0;
 for(const locale of ['vi','en']){
  const resume=doc.locales[locale],text=resume.work.find(w=>w.id==='work-0').description;
  const html=renderToStaticMarkup(React.createElement(Markdown,null,text));assert.equal((html.match(/<li>/g)??[]).length,4);assert(html.includes('<strong>'));assert(html.includes('<em>'));
  for(const note of resume.annotations??[]){if(!note.enabled)continue;const source=annotationText(resume,note.field,note.itemId),related=resume.annotations.filter(a=>a.field===note.field&&a.itemId===note.itemId&&a.enabled);const output=renderToStaticMarkup(React.createElement(Markdown,{skipHtml:true,remarkPlugins:[annotationRemark(source,related)]},source));assert(output.includes(`data-portfolio-annotation="${note.id}"`));notes++;}
 }
 if(!process.argv.includes('--apply')){console.log(JSON.stringify({mode:'read-only-plan',revision:before.site.revision,tooltips:notes,bulletItemsPerLocale:4,publishRequested:true}));process.exit(0);}
 const beforeBackup=await backup('work-spacing-publish-before',{before,proposed:doc});
 assert.equal(fingerprint(capture()),fingerprint(before),'Concurrent edits; inspect before publication');
 const needsSave=fingerprint(doc)!==fingerprint(before.site.draft),publishRevision=before.site.revision+(needsSave?1:0);
 query(`begin;set local role authenticated;select set_config('request.jwt.claim.sub',${literal(before.site.owner_id)},true);${needsSave?`select revision from public.save_portfolio(${literal(JSON.stringify(doc))}::jsonb,${before.site.revision});`:''}select id from public.publish_portfolio(${publishRevision});commit;select true as published;`);
 const after=capture(),current=after.versions.find(v=>v.id===after.site.published_id);
 assert(current);assert.equal(fingerprint(current.document),fingerprint(doc));assert.equal(fingerprint(after.site.draft),fingerprint(doc));assert.equal(after.site.revision,publishRevision+1);assert.equal(after.versions.length,before.versions.length+1);assert.equal(fingerprint(after.versions.filter(v=>v.id!==current.id)),fingerprint(before.versions));assert.equal(fingerprint(after.media),fingerprint(before.media));
 const afterBackup=await backup('work-spacing-publish-after',{after});
 console.log(JSON.stringify({result:'PASS',revision:after.site.revision,version:current.id,tooltips:notes,bulletItemsPerLocale:4,published:true,oldVersionsRetained:true,mediaUnchanged:true,beforeBackup,afterBackup}));
}catch{console.error('Publish operation stopped. Inspect encrypted checkpoints and current version before retrying; no credentials logged.');process.exitCode=1;}
