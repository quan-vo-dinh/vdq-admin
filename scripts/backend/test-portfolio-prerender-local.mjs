// Read-only checks against the existing local owner session; no auth/data mutations.
import assert from 'node:assert/strict';
import {localDomainSession} from './local-domain-session.mjs';

const origin='http://localhost:3000';
const {cookie}=localDomainSession();
let checks=0;
for(const path of ['/apps/portfolio','/apps/portfolio/preview']){
  for(const headers of [{},{RSC:'1','Next-Router-Prefetch':'1'},{RSC:'1','Next-Router-Prefetch':'1','Next-Router-Segment-Prefetch':'/_tree'}]){
    let target=origin+path,response;
    for(let hop=0;hop<3;hop++){
      response=await fetch(target,{headers:{Cookie:cookie,...headers},redirect:'manual',signal:AbortSignal.timeout(30000)});
      if(response.status!==307)break;
      // Next normalizes synthetic prefetches to its own _rsc URL. Never follow a login or cross-origin redirect.
      const next=new URL(response.headers.get('location'),target);
      assert.equal(next.origin,origin);assert.equal(next.pathname,path);assert.ok(next.searchParams.has('_rsc'));
      target=next.href;
    }
    assert.equal(response.status,200);
    const body=await response.text();
    assert.doesNotMatch(body,/blocking-prerender-current-time|unstable value|Blocking Route/);
    checks++;
  }
  const anonymous=await fetch(origin+path,{redirect:'manual',signal:AbortSignal.timeout(20000)});
  assert.equal(anonymous.status,307);assert.ok(anonymous.headers.get('location').includes('/auth/'));
  checks++;
}
const anonymousApi=await fetch(origin+'/api/portfolio/draft',{signal:AbortSignal.timeout(20000)});
assert.equal(anonymousApi.status,401);checks++;
console.log(JSON.stringify({result:'PASS',checks,ownerDocumentAndPrefetch:true,anonymousDenied:true,mutations:false}));
