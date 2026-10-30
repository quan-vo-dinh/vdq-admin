import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseDocument,safeUrl,mediaIds} from '../../lib/portfolio/model.ts';
const fixture=()=>JSON.parse(readFileSync('lib/portfolio/initial-content.json','utf8'));
test('imports complete bilingual content and preserves source date discrepancy',()=>{const d=parseDocument(fixture());assert.equal(d.locales.vi.education[0].end,'09/2026');assert.equal(d.locales.en.education[0].end,'Oct 2026');assert.equal(d.locales.vi.projects.length,4);});
test('URLs reject executable, credential, protocol-relative and whitespace forms',()=>{for(const s of ['javascript:alert(1)','data:image/svg+xml,<svg>','//evil.invalid','https://user:pass@evil.invalid','https://site.invalid/ bad','/\\evil'])assert.equal(safeUrl(s),false,s);for(const s of ['/portfolio','https://github.com/quan-vo-dinh','mailto:a@b.invalid','#'])assert.equal(safeUrl(s),true,s);});
test('unknown keys, executable icons, arbitrary images, duplicate IDs and parity rejected',()=>{for(const change of [d=>d.extra=true,d=>d.locales.vi.skills[0].icon='<svg/>',d=>d.locales.vi.avatarUrl='https://evil.invalid/image',d=>d.locales.vi.skills[1].id=d.locales.vi.skills[0].id,d=>d.locales.vi.skills.pop(),d=>d.locales.vi.contact.social=d.locales.vi.contact.social.filter(x=>x.id!=='LinkedIn')]){const d=fixture();change(d);assert.throws(()=>parseDocument(d));}});
test('media references collected across retained content without duplicates',()=>assert.deepEqual(mediaIds({a:'media:80000000-0000-4000-8000-000000000001',b:['media:80000000-0000-4000-8000-000000000001']}),['80000000-0000-4000-8000-000000000001']));

test('expanded icon catalog is accepted in both locales and matches database validation', async () => {
  const { iconNames } = await import('../../lib/portfolio/model.ts');
  const migration = readFileSync('supabase/migrations/20261030000100_portfolio_icon_catalog.sql', 'utf8');
  const schema = JSON.parse(migration.match(/ schema='(.*?)'::json;/s)[1]);
  let checked = 0;
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (node.enum?.includes('Typescript')) {
      assert.deepEqual(node.enum, [...iconNames]);
      checked++;
    }
    Object.values(node).forEach(visit);
  }
  visit(schema);
  assert.equal(checked, 8, 'skills, navigation, contact and project link icons in both locales');
  for (const icon of iconNames) {
    const doc = fixture();
    for (const locale of ['vi', 'en']) doc.locales[locale].skills[0].icon = icon;
    assert.equal(parseDocument(doc).locales.vi.skills[0].icon, icon);
  }
});
