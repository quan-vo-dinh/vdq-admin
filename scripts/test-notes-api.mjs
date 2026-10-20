import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { localDomainSession } from './backend/local-domain-session.mjs';
const base=process.env.NOTES_TEST_URL ?? 'http://localhost:3000';
assert.ok(/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(base),'Local test only');
const {cookie}=localDomainSession();
const created=[];
async function request(method,body,authenticated=true) {
 const response=await fetch(`${base}/api/notes`,{method,headers:{'Content-Type':'application/json',origin:'http://localhost:3000',...(authenticated?{cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});
 return {status:response.status,body:await response.json(),headers:response.headers};
}
try {
 assert.equal((await request('GET',null,false)).status,401);
 const id=randomUUID();created.push(id);
 const body={id,title:'P04 API fixture',color:'chart-2',datef:'2026-10-19T21:45:00+07:00',content:{type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'Rich text retained',marks:[{type:'bold'}]}]}]}};
 const added=await request('POST',body);assert.equal(added.status,201);const note=added.body.item;
 assert.equal(note.id,id);assert.equal(note.revision,1);assert.equal(note.datef,'2026-10-19T14:45:00+00:00');assert.equal(note.content.content[0].content[0].marks[0].type,'bold');
 assert.match(added.headers.get('cache-control'),/private.*no-store/);
 const retry=await request('POST',body);assert.equal(retry.status,201);assert.equal(retry.body.data.filter(n=>n.id===id).length,1);
 const edits=await Promise.all(['A','B'].map(title=>request('PUT',{id,title,expectedRevision:1})));
 assert.deepEqual(edits.map(r=>r.status).sort(),[200,409]);
 const saved=(await request('GET')).body.data.find(n=>n.id===id);assert.equal(saved.revision,2);assert.deepEqual(saved.content,note.content);
 assert.equal((await request('DELETE',{id,expectedRevision:1})).status,409);
 assert.equal((await request('PUT',{id,expectedRevision:2,datef:'bad'})).status,400);
 assert.equal((await request('PUT',{id:randomUUID(),expectedRevision:1,title:'missing'})).status,404);
 assert.equal((await request('POST',{...body,id:randomUUID(),content:{type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'x',marks:[{type:'link',attrs:{href:'javascript:alert(1)'}}]}]}]}})).status,400);
 assert.equal((await request('POST',{...body,id:randomUUID(),content:{type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'x'.repeat(210000)}]}]}})).status,400);
 assert.equal((await request('DELETE',{id,expectedRevision:2})).status,200);
 console.log('PASS Notes: owner CRUD, UUID canonical retry, rich text/date, private cache, atomic CAS, stale delete, invalid date/link/oversize, anon denial');
} finally {
 const current=await request('GET');for(const item of current.body.data??[])if(created.includes(item.id))await request('DELETE',{id:item.id,expectedRevision:item.revision});
}
