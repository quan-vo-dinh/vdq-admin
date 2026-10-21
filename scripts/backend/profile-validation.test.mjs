import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createRequire} from 'node:module';
const directory=mkdtempSync(join(tmpdir(),'profile-validation-'));
let validation;
try {
 execFileSync('pnpm',['exec','tsc','--ignoreConfig','--target','es2022','--module','commonjs','--skipLibCheck','--outDir',directory,'lib/personal/validation.ts'],{stdio:'pipe'});
 validation=createRequire(import.meta.url)(join(directory,'personal/validation.js'));
} finally {rmSync(directory,{recursive:true,force:true});}
const {profileFields,personalKeys}=validation;
test('profile accepts domain-only social links and saves canonical HTTPS URLs',()=>{
 const result=profileFields({linkedin:' linkedin.com/in/example/ ',github:'github.com/example',facebook:'https://www.facebook.com/example',instagram:''},personalKeys);
 assert.equal(result.linkedin,'https://linkedin.com/in/example/');
 assert.equal(result.github,'https://github.com/example');
 assert.equal(result.facebook,'https://www.facebook.com/example');
 assert.equal(result.instagram,'');
});
test('profile still rejects dangerous links, credentials, malformed domains and invalid email',()=>{
 for(const github of ['javascript:alert(1)','data:text/html,bad','https://user:password@example.com','/profile','//example.com','invalid','github.com/a b'])assert.throws(()=>profileFields({github},personalKeys),{code:'invalid_url'});
 assert.throws(()=>profileFields({email:'not-an-email'},personalKeys),{code:'invalid_email'});
 assert.throws(()=>profileFields({role:'admin'},personalKeys),{code:'invalid'});
 assert.throws(()=>profileFields({firstName:'x'.repeat(501)},personalKeys),{code:'invalid'});
});
