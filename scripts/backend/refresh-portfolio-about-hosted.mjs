// Explicit owner-requested copy update. Reads current hosted draft; saves only with --apply.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import Markdown from 'react-markdown';
import {parseDocument,mediaIds} from '../../lib/portfolio/model.ts';
import {fingerprint} from '../../lib/portfolio/editor-state.ts';
import {annotationText,annotationRemark} from '../../lib/portfolio/annotations.ts';
import {refreshAboutDocument} from '../data/portfolio-about-refresh.mjs';
import {seal,open} from '../data/snapshot.mjs';
import {atomicOutput} from './atomic-output.mjs';
const project='wcgdvsiiemurehkprvqw',key='/Users/vodinhquan/.config/dashboard-backup-recovery/private.pem';
const literal=value=>"'"+value.replaceAll("'","''")+"'";
function query(sql){const r=JSON.parse(execFileSync('pnpm',['exec','supabase','db','query','--linked','--project-ref',project,sql],{stdio:['ignore','pipe','pipe'],maxBuffer:8*1024*1024,timeout:60000}).toString());assert(Array.isArray(r.rows));return r.rows;}
function capture(){const rows=query("select to_jsonb(s) as site,(select coalesce(jsonb_agg(to_jsonb(v) order by v.id),'[]') from public.portfolio_versions v where v.owner_id=s.owner_id) as versions,(select coalesce(jsonb_agg(to_jsonb(m) order by m.id),'[]') from public.portfolio_media m where m.owner_id=s.owner_id) as media from public.portfolio_sites s join private.app_owner o on o.user_id=s.owner_id where o.enabled and o.github_user_id='129001260'");assert.equal(rows.length,1);parseDocument(rows[0].site.draft);return rows[0];}
async function backup(label,payload){const value={project,label,...payload},envelope=seal({schemaVersion:1,datasets:[],portfolioAbout:value},await readFile(key+'.pub'));assert.equal(fingerprint(open(envelope,await readFile(key)).portfolioAbout),fingerprint(value));const file='/Users/vodinhquan/Documents/dashboard-backups/portfolio-editorial/'+new Date().toISOString().replaceAll(':','-')+'-'+label+'.enc.json';atomicOutput(file,JSON.stringify(envelope),{replace:false});return file;}
function validateChange(original,updated){
 parseDocument(updated);
 const restored=structuredClone(updated);
 for(const locale of ['vi','en']){
  restored.locales[locale].summary=original.locales[locale].summary;
  restored.locales[locale].work.find(w=>w.id==='work-0').description=original.locales[locale].work.find(w=>w.id==='work-0').description;
  restored.locales[locale].annotations=original.locales[locale].annotations;
 }
 assert.equal(fingerprint(restored),fingerprint(original),'Unrelated content changed');
 for(const id of mediaIds(updated))assert(mediaIds(original).includes(id),'Unexpected new media');
 let notes=0;
 for(const locale of ['vi','en']){
  const resume=updated.locales[locale];
  const summaryHtml=renderToStaticMarkup(React.createElement(Markdown,null,resume.summary));
  const workHtml=renderToStaticMarkup(React.createElement(Markdown,null,resume.work.find(w=>w.id==='work-0').description));
  assert(summaryHtml.includes('<strong>'));assert(summaryHtml.includes('<em>'));assert(workHtml.includes('<ul>'));assert.equal((workHtml.match(/<li>/g)??[]).length,4);assert(workHtml.includes('<em>'));
  for(const note of resume.annotations??[]){if(!note.enabled)continue;const source=annotationText(resume,note.field,note.itemId);const related=resume.annotations.filter(a=>a.enabled&&a.field===note.field&&a.itemId===note.itemId);const html=renderToStaticMarkup(React.createElement(Markdown,{skipHtml:true,remarkPlugins:[annotationRemark(source,related)]},source));assert(html.includes(`data-portfolio-annotation="${note.id}"`),`Stale or overlapping tooltip: ${locale}/${note.id}`);notes++;}
 }
 return notes;
}
try{
 const before=capture(),operation=refreshAboutDocument(before.site.draft),rendered=validateChange(before.site.draft,operation.document);
 if(!process.argv.includes('--apply'))console.log(JSON.stringify({mode:'read-only-plan',revision:before.site.revision,report:operation.report,renderedTooltips:rendered,unrelatedContentUnchanged:true}));
 else if(fingerprint(before.site.draft)===fingerprint(operation.document))console.log(JSON.stringify({result:'already-current',revision:before.site.revision,report:operation.report}));
 else{
  const beforeBackup=await backup('about-refresh-before',{before,proposed:operation.document});
  assert.equal(fingerprint(capture()),fingerprint(before),'Concurrent edits; re-read before saving');
  query(`begin;set local role authenticated;select set_config('request.jwt.claim.sub',${literal(before.site.owner_id)},true);select revision from public.save_portfolio(${literal(JSON.stringify(operation.document))}::jsonb,${before.site.revision});commit;select true as saved;`);
  const after=capture();assert.equal(after.site.revision,before.site.revision+1);assert.equal(fingerprint(after.site.draft),fingerprint(operation.document));assert.equal(after.site.published_id,before.site.published_id);assert.equal(fingerprint(after.versions),fingerprint(before.versions));assert.equal(fingerprint(after.media),fingerprint(before.media));
  const readback=validateChange(before.site.draft,after.site.draft);const afterBackup=await backup('about-refresh-after',{after});
  console.log(JSON.stringify({result:'PASS',revision:after.site.revision,report:operation.report,renderedTooltips:readback,unrelatedContentUnchanged:true,mediaUnchanged:true,publicationUnchanged:true,beforeBackup,afterBackup}));
 }
}catch(error){console.error(error instanceof assert.AssertionError?error.message:'Copy update stopped; inspect encrypted checkpoint/readback before retrying.');process.exitCode=1;}
