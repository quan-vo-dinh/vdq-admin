import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
const dir=mkdtempSync(join(tmpdir(),'theme-transition-'));
let transitionTheme;
try {
 execFileSync('pnpm',['exec','tsc','--ignoreConfig','--target','es2022','--module','commonjs','--skipLibCheck','--outDir',dir,'lib/personal/theme-transition.ts']);
 ({transitionTheme}=createRequire(import.meta.url)(join(dir,'theme-transition.js')));
} finally {rmSync(dir,{recursive:true,force:true});}
function fixture({supported=true,reduced=false,failReady=false,failAnimate=false,failStart=false}={}){
 const classes=new Set(['style-lyra','light']);const calls=[];let snapshot;
 const root={classList:{remove:(...xs)=>xs.forEach(x=>classes.delete(x)),add:x=>classes.add(x)},style:{},animate:(frames,options)=>{calls.push({frames,options});if(failAnimate)throw Error('unsupported pseudo-element');return {finished:Promise.resolve()};}};
 globalThis.document={documentElement:root,...(supported?{startViewTransition:apply=>{if(failStart)throw Error('hidden');apply();snapshot=[...classes];return {ready:failReady?Promise.reject(Error('skipped')):Promise.resolve(),finished:Promise.resolve(),skipTransition:()=>calls.push('skip')};}}:{})};
 globalThis.window={matchMedia:()=>({matches:reduced})};
 return {classes,calls,root,snapshot:()=>snapshot};
}
test('both directions update DOM and theme state inside snapshot before animating',async()=>{
 const f=fixture();const themes=[];
 for(const theme of ['dark','light']){
  await transitionTheme(theme,t=>themes.push(t));
  assert.ok(f.classes.has(theme));assert.equal(f.root.style.colorScheme,theme);assert.ok(f.snapshot().includes(theme));
 }
 assert.deepEqual(themes,['dark','light']);assert.ok(f.classes.has('style-lyra'));
 assert.equal(f.calls.filter(c=>typeof c==='object').length,2);
 assert.equal(f.calls[0].options.pseudoElement,'::view-transition-new(root)');
 assert.equal(f.calls[0].options.duration,800);
});
for(const options of [{supported:false},{reduced:true},{failReady:true},{failAnimate:true},{failStart:true}]){
 test(`theme still applies when animation cannot run: ${JSON.stringify(options)}`,async()=>{
  const f=fixture(options);await transitionTheme('dark',()=>{});assert.ok(f.classes.has('dark'));assert.ok(!f.classes.has('light'));
  if(options.reduced||options.supported===false)assert.equal(f.calls.length,0);
 });
}
