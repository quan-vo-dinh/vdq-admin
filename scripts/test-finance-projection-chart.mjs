import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createRequire,Module} from 'node:module';
const require=createRequire(import.meta.url);
const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const {transformSync}=require('next/dist/build/swc');
const e=React.createElement;
const container=({children})=>e('div',null,children);
let axis,tooltip;
const mocks={};
function load(file){
  const filename=resolve(file);
  const {code}=transformSync(readFileSync(filename,'utf8'),{filename,jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}},target:'es2022'},module:{type:'commonjs'}});
  const compiled=new Module(filename),fallback=createRequire(filename);
  compiled.require=name=>Object.hasOwn(mocks,name)?mocks[name]:fallback(name);
  compiled._compile(code,filename);
  return compiled.exports;
}
const projection=load('lib/finance/projection.ts');
const plan={...projection.emptySavingsPlan('2026-10-25'),endDate:'2027-01-31',cycles:{
  '2026-10':{income:'8000000',spending:'3000000',savingDate:'2026-10-31'},
}};
mocks['@/lib/finance/projection']=projection;
mocks['@/lib/finance/model']={overview:()=>({balanceKnown:true,tracked:818564})};
mocks['@/app/context/finance-context']={useFinance:()=>({data:{asOf:'2026-10-25',goals:[]}})};
mocks['@/app/context/finance-context/use-savings-plan']={useSavingsPlan:()=>({saved:{plan},isLoading:false})};
mocks['./locale']={useFinanceLocale:()=>({money:String,compactMoney:String,text:value=>value,date:value=>{
  assert.ok(projection.validDate(value),'Only valid calendar dates reach the formatter');
  return value;
}})};
for(const name of ['@/components/ui/button','@/components/ui/input','@/components/ui/checkbox','@/components/ui/field','@/components/ui/alert','@/components/ui/dialog','@/components/ui/skeleton','@/components/ui/number-ticker','@/app/components/tables/feature-data-table','./shared','./template-layout','./page-header','lucide-react'])
  mocks[name]=new Proxy({}, {get:()=>container});
mocks['recharts']=new Proxy({}, {get:(_,name)=>name==='XAxis'?(props)=>{axis=props;return null;}:container});
mocks['@/components/ui/chart']={ChartContainer:container,ChartTooltip:({content})=>content};
mocks['./chart-tools']={FinanceChartTooltip:(props)=>{tooltip=props;return null;}};
const {CashFlowPage}=load('app/components/finance/cash-flow.tsx');
renderToStaticMarkup(e(CashFlowPage));
assert.ok(axis&&tooltip,'Render the actual four-cycle planner and capture its chart callbacks');
const timestamp=Date.parse('2026-10-31T00:00:00Z');
assert.equal(axis.tickFormatter(timestamp),'2026-10-31');
// The shared tooltip replaces a numeric label with the series display name.
for(const label of ['Tiết kiệm tích lũy','Trích tiết kiệm / bù ngân sách',undefined]){
  assert.equal(tooltip.labelFormatter(label,[{payload:{date:'2026-10-31',timestamp}}]),'2026-10-31');
}
for(const value of [undefined,NaN,'invalid',Infinity])assert.equal(axis.tickFormatter(value),'—');
for(const payload of [[],[{payload:{}}],[{payload:{date:''}}],[{payload:{date:'2026-02-30'}}]])
  assert.equal(tooltip.labelFormatter('Tiết kiệm tích lũy',payload),'—');
console.log('PASS: four-cycle planner renders; tooltip uses the point date, handles series labels and incomplete payloads without Invalid time value.');
