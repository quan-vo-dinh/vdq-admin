import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync} from 'node:crypto';
import {seal,open} from '../data/snapshot.mjs';
import {tables,validate,digest,restore} from './backup.mjs';
const owner={enabled:true,user_id:'00000000-0000-4000-8000-000000000001',github_user_id:'123'};
function fixture(){return {format:'dashboard-business-v1',owner,versions:[],migrations:[],data:Object.fromEntries(tables.map(t=>[t,[]])),media:[]};}
test('backup validates exact scope, owner and referenced object bytes',()=>{const p=fixture();assert.equal(validate(p),p);p.data.today_items=[];assert.throws(()=>validate(p));delete p.data.today_items;p.data.notes=[{id:'1',owner_id:'other'}];assert.throws(()=>validate(p));p.data.notes=[];const path=owner.user_id+'/goals/00000000-0000-4000-8000-000000000002.webp';p.data.finance_goals=[{id:'g',owner_id:owner.user_id,image_path:path}];assert.throws(()=>validate(p));const bytes=Buffer.from('image fixture');p.media=[{path,sha256:digest(bytes),bytes:bytes.toString('base64')}];assert.equal(validate(p),p);p.media[0].bytes=Buffer.from('corrupt').toString('base64');assert.throws(()=>validate(p));});
test('business encryption authenticates bundle and wrong key fails',()=>{const keys=generateKeyPairSync('rsa',{modulusLength:2048});const other=generateKeyPairSync('rsa',{modulusLength:2048});const encrypted=seal({schemaVersion:1,datasets:[],business:fixture()},keys.publicKey);assert.equal(open(encrypted,keys.privateKey).business.format,'dashboard-business-v1');assert.throws(()=>open(encrypted,other.privateKey));encrypted.encrypted=encrypted.encrypted.slice(0,-8)+'AAAAAAAA';assert.throws(()=>open(encrypted,keys.privateKey));});
test('restore refuses all targets except disposable local drill before reading input',async()=>{await assert.rejects(restore('no-file','no-key','/production'));await assert.rejects(restore('no-file','no-key',process.cwd()));});
