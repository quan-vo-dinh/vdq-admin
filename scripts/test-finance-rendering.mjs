import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createRequire,Module} from 'node:module';
const require=createRequire(import.meta.url);
const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const {transformSync}=require('next/dist/build/swc');
const e=React.createElement;
let state,views=0,slots=0;
const container=({children})=>e('div',null,children);
const loading={FinanceLoading:()=>e('div',null,'Loading'),FinancePageSkeleton:({path})=>e('div',{'data-skeleton':path})};
const mocks={
  '@/app/context/finance-context':{useFinance:()=>state},
  './locale':{useFinanceLocale:()=>({text:s=>s,formatMessage:s=>s})},
  './loading':loading,
  './page-header':{FinancePageHeader:()=>e('header',null,'Finance')},
  '@/lib/platform/navigation':{usePathname:()=>'/finance/cash-flow'},
  '@/components/ui/button':{Button:container},
  '@/components/ui/alert':{Alert:container,AlertDescription:container},
  '@/lib/utils':{cn:(...values)=>values.filter(Boolean).join(' ')},
  '@/app/api/global-fetcher':{ApiError:class ApiError extends Error{}},
  'lucide-react':{X:()=>null},
};
function load(file){
  const filename=resolve(file);
  const {code}=transformSync(readFileSync(filename,'utf8'),{filename,jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}},target:'es2022'},module:{type:'commonjs'}});
  const compiledModule=new Module(filename);
  const fallback=createRequire(filename);
  compiledModule.require=name=>Object.hasOwn(mocks,name)?mocks[name]:fallback(name);
  compiledModule._compile(code,filename);
  return compiledModule.exports;
}
const {FinanceShell}=load('app/components/finance/shell.tsx');
mocks['@/app/components/finance/page-content']=load('app/components/finance/page-content.tsx');
const routes=[['','overview','OverviewPage'],['transactions','transactions','TransactionsPage'],['budgets','budgets','BudgetsPage'],['goals','goals','GoalsPage'],['cash-flow','cash-flow','CashFlowPage']];
for(const [slug,source,name] of routes){
  mocks[`@/app/components/finance/${source}`]={[name]:()=>{assert.ok(state.data,'Data-dependent view must not render before finance is loaded');views++;return e('main',{'data-view':name});}};
  const {default:Page}=load(`app/(dashboard-layout)/finance/${slug?slug+'/':''}page.tsx`);
  function RouteSlot(){slots++;return e(Page);}
  const path='/finance'+(slug?'/'+slug:'');
  for(const scenario of ['loading','loaded','error','stale']){
    state={data:['loaded','stale'].includes(scenario)?{}:undefined,error:['error','stale'].includes(scenario)?new Error('offline'):undefined,notice:'',notify(){},reload(){}};
    views=0;slots=0;
    const html=renderToStaticMarkup(e(FinanceShell,null,e(RouteSlot)));
    assert.equal(slots,1,`${path}: router slot must stay mounted during ${scenario}`);
    assert.equal(views,state.data?1:0,`${path}: finance content must respect data availability`);
    if(scenario==='loading')assert.ok(html.includes(`data-skeleton="${path}"`),`${path}: render the correct page skeleton`);
    if(state.data)assert.ok(html.includes(`data-view="${name}"`));
  }
}
console.log('PASS: all five finance route slots render during loading/error; page-specific skeletons, safe data gates and stale-data views are preserved.');
