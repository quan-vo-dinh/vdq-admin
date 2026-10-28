import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fingerprint,mirrorResume,hasUnpublishedChanges} from '../../lib/portfolio/editor-state.ts';
const fixture=()=>JSON.parse(readFileSync('lib/portfolio/initial-content.json','utf8'));
for(const locale of ['vi','en']) {
 const other=locale==='vi'?'en':'vi';
 test(`${locale} list add/delete/reorder preserves opposite translations and both ID sets`,()=>{
  const doc=fixture(),original=fingerprint(doc),resume=structuredClone(doc.locales[locale]);
  // Simulate distinct translations, an edit to one existing item, one removed item,
  // a new item, and a changed order in the same user operation.
  const retained=resume.work[2],removed=resume.work[1];
  retained.title='Edited in '+locale;
  const added={...structuredClone(resume.work[0]),id:'new-work',title:'New '+locale};
  resume.work=[retained,added,resume.work[0]];
  const next=mirrorResume(doc,locale,resume);
  assert.deepEqual(next.locales[other].work.map(x=>x.id),resume.work.map(x=>x.id));
  assert.equal(next.locales[other].work.find(x=>x.id===retained.id).title,doc.locales[other].work.find(x=>x.id===retained.id).title);
  assert.equal(next.locales[locale].work[0].title,'Edited in '+locale);
  assert.equal(next.locales[other].work.some(x=>x.id===removed.id),false);
  assert.equal(next.locales[other].work[1].title,'New '+locale);
  assert.equal(fingerprint(doc),original,'source document remains unchanged');
  resume.work[1].title='Mutated caller';
  assert.equal(next.locales[locale].work[1].title,'New '+locale,'returned state owns its data');
  next.locales[locale].work[1].title='Edited later';
  assert.equal(next.locales[other].work[1].title,'New '+locale,'new translations do not share object references');
 });
 test(`${locale} social deletion/reorder mirrors membership without overwriting translated names`,()=>{
  const doc=fixture(),resume=structuredClone(doc.locales[locale]);
  const first=doc.locales[other].contact.social.find(x=>x.id==='GitHub');first.name='Other locale GitHub';
  resume.contact.social=[...resume.contact.social].reverse().filter(x=>x.id!=='X');
  resume.contact.social.find(x=>x.id==='GitHub').name='Edited GitHub';
  const next=mirrorResume(doc,locale,resume);
  assert.deepEqual(next.locales[other].contact.social.map(x=>x.id),resume.contact.social.map(x=>x.id));
  assert.equal(next.locales[other].contact.social.find(x=>x.id==='GitHub').name,'Other locale GitHub');
 });
}
test('content fingerprint ignores object-key order but preserves list order and text changes',()=>{
 assert.equal(fingerprint({b:{z:'value',a:1},a:['one','two']}),fingerprint({a:['one','two'],b:{a:1,z:'value'}}));
 assert.notEqual(fingerprint({items:['one','two']}),fingerprint({items:['two','one']}));
 assert.notEqual(fingerprint({name:'Old'}),fingerprint({name:'New'}));
});
test('restored publication is compared by document even when its recorded draft revision matches',()=>{
 const draft=fixture(),restored=fixture();restored.locales.vi.summary='An earlier publication';
 const publication={id:'version-restored',draft_revision:8,document:restored},site={revision:8,draft};
 assert.equal(site.revision,publication.draft_revision);
 assert.equal(hasUnpublishedChanges(site.draft,publication.id,publication.document),true);
 assert.equal(hasUnpublishedChanges(draft,'live',structuredClone(draft)),false);
 assert.equal(hasUnpublishedChanges(draft,null,null),true,'new draft is unpublished');
 assert.equal(hasUnpublishedChanges(draft,'live',undefined),true,'unknown live content cannot be labelled up to date');
 assert.equal(hasUnpublishedChanges(null,null,null),false,'loading has no editable draft');
});

test('confirmed work/project deletion removes only associated notes in both locales',()=>{
 const doc=fixture();
 for (const locale of ['vi','en']) doc.locales[locale].annotations=[
  {id:locale+'-work',field:'work.description',itemId:doc.locales[locale].work[0].id},
  {id:locale+'-project',field:'projects.description',itemId:doc.locales[locale].projects[0].id},
  {id:locale+'-keep-work',field:'work.description',itemId:doc.locales[locale].work[1].id},
  {id:locale+'-summary',field:'summary',itemId:''},
 ];
 const resume=structuredClone(doc.locales.vi);
 resume.work=resume.work.slice(1); resume.projects=resume.projects.slice(1);
 const next=mirrorResume(doc,'vi',resume);
 for(const locale of ['vi','en']) assert.deepEqual(next.locales[locale].annotations.map(x=>x.id),[locale+'-keep-work',locale+'-summary']);
 assert.equal(doc.locales.vi.annotations.length,4,'source is unchanged');
 const edited=structuredClone(next.locales.vi);edited.summary='Changed prose';
 assert.deepEqual(mirrorResume(next,'vi',edited).locales.vi.annotations,edited.annotations,'ordinary prose changes retain notes');
});
