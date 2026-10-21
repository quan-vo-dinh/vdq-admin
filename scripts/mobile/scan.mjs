import { readdirSync, readFileSync, existsSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { parseEnv } from 'node:util';
import { gzipSync } from 'node:zlib';
const secrets=[];
for(const file of readdirSync('.').filter(name=>/^\.env(?:\.|$)/.test(name)&&name!=='.env.example')) {
 try { for(const [name,value] of Object.entries(parseEnv(readFileSync(file,'utf8')))) if(value.length>=12 && /secret|password|token|service_role|database_url/i.test(name) && !name.startsWith('NEXT_PUBLIC_')) secrets.push({name,value}); } catch { /* Non-dotenv local tooling file. */ }
}
function scan(buffer,label) {
 for(const secret of secrets) if(buffer.includes(Buffer.from(secret.value))) throw new Error(`Private env value ${secret.name} in ${label}`);
 const text=buffer.toString('utf8');
 if(/sb_secret_[A-Za-z0-9_-]{20,}|scrypt:[a-f0-9]{32}:[a-f0-9]{128}|-----BEGIN (?:RSA )?PRIVATE KEY-----[\r\n]+[A-Za-z0-9+/=\r\n]{64}/.test(text)) throw new Error('Secret pattern in '+label);
 if(/OWNER_SESSION_SECRET_KEY|OWNER_PASSWORD_HASH|serverSupabase/.test(text)) throw new Error('Server runtime marker in '+label);
}
const files=readdirSync('mobile/dist',{recursive:true}).filter(file=>statSync(join('mobile/dist',file)).isFile());
let js=0,gzip=0;
for(const file of files) {const buffer=readFileSync(join('mobile/dist',file));scan(buffer,file);if(file.endsWith('.map'))throw new Error('Source map packaged: '+file);if(file.endsWith('.js')){js+=buffer.length;gzip+=gzipSync(buffer).length;}}
const artifacts=[];
for(const file of ['mobile/android/app/build/outputs/apk/debug/app-debug.apk','mobile/android/app/build/outputs/apk/release/app-release-unsigned.apk','mobile/android/app/build/outputs/apk/release/app-release.apk']) {
 if(!existsSync(file))continue;
 const archive=readFileSync(file);const content=execFileSync('unzip',['-p',file],{maxBuffer:256*1024*1024});scan(content,relative('.',file));
 artifacts.push({path:file,bytes:archive.length,sha256:createHash('sha256').update(archive).digest('hex')});
}
const manifest=JSON.parse(readFileSync('mobile/dist/.vite/manifest.json','utf8'));
const visited=new Set();function visit(key){if(visited.has(key))return;visited.add(key);for(const child of manifest[key]?.imports??[])visit(child);}
for(const key of Object.keys(manifest))if(manifest[key].isEntry)visit(key);
const initialFiles=[...visited].map(key=>manifest[key].file);
const initialJs=initialFiles.filter(file=>file.endsWith('.js')).reduce((sum,file)=>sum+readFileSync(join('mobile/dist',file)).length,0);
const report={at:new Date().toISOString(),result:'PASS',envSecretValuesChecked:secrets.length,staticFiles:files.length,totalJsBytes:js,totalJsGzipBytes:gzip,initialJsBytes:initialJs,lazyEntries:Object.values(manifest).filter(value=>value.isDynamicEntry).length,artifacts,nativeAcceptance:'PENDING real device and user signing key'};
mkdirSync('test-results/p12',{recursive:true});writeFileSync('test-results/p12/scan.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
