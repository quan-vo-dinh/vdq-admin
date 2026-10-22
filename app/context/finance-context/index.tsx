"use client";
import { apiFetch } from "@/lib/api/transport";
import { createContext, useContext, useRef, useState, type ReactNode } from 'react';
import useSWR from 'swr';
import { getFetcher } from '@/app/api/global-fetcher';
import type { FinanceData } from '@/lib/finance/model';
import type { FinanceMessage } from '@/lib/finance/i18n';
import { financeNumbers } from '@/lib/finance/wire';
import { recentMonthRange, type FinancePeriodMode } from '@/lib/finance/period';
import { todayKey } from '@/lib/learning/model';
function useFinanceState() {
 const {data,error,mutate}=useSWR<FinanceData,Error>('/api/finance',async url=>financeNumbers(await getFetcher(url)) as FinanceData,{refreshInterval:60000});
 const [month,setMonth]=useState(()=>todayKey().slice(0,7));
 const [periodMode,setPeriodMode]=useState<FinancePeriodMode>('calendar');
 const period=periodMode==='recent-month'?recentMonthRange(data?.asOf??todayKey()):month;
 const [notice,notify]=useState<string|FinanceMessage>('');
 const [busy,setBusy]=useState(false);const lock=useRef(false);
 async function action(resource:string,method:string,values:Record<string,unknown>) {
  if(lock.current) throw new Error('Đang lưu, vui lòng chờ.');
  lock.current=true;setBusy(true);
  try {
   const body=Object.fromEntries(Object.entries(values).map(([k,v])=>[k,['opening','opening_excluded','cash_received','amount','default_limit','limit_amount','target','allocated','monthly'].includes(k)?String(v):v]));
   const r=await apiFetch(`/api/finance/${resource}`,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
   if(!r.ok) {const e=await r.json(); const messages:Record<string,string>={duplicate_transaction:'Có giao dịch đã tồn tại hoặc trùng mã tham chiếu. Chưa nhập thêm dòng nào.',default_category_protected:'Danh mục mặc định chỉ có thể đổi tên hoặc lưu trữ.',category_has_history:'Danh mục đã có lịch sử; chỉ đổi tên hoặc lưu trữ.',category_has_transactions:'Danh mục đang có giao dịch nên không thể xóa.',referenced_or_conflict:'Dữ liệu đang được sử dụng hoặc mã bị trùng. Hãy kiểm tra lại hoặc dùng lưu trữ.',conflict:'Dữ liệu đã thay đổi. Giữ bản nháp; tải lại dữ liệu trước khi sửa tiếp.',invalid_category_code:'Mã danh mục không hợp lệ.',invalid_category_name:'Tên danh mục không hợp lệ.',invalid_category_kind:'Loại danh mục không hợp lệ.'}; throw new Error(messages[e.code]??(r.status===409?'Mã đã tồn tại hoặc dữ liệu đã thay đổi. Giữ bản nháp và tải lại.':`Không lưu được (${e.code}).`));}
   const result=await r.json();await mutate();return result;
  } catch(e) {notify(e instanceof Error?e.message:'Không lưu được.');throw e;}
  finally {lock.current=false;setBusy(false);}
 }
 return {data,error,month,setMonth,period,periodMode,setPeriodMode,notice,notify,busy,action,reload:()=>{void mutate();}};
}
const FinanceContext=createContext<ReturnType<typeof useFinanceState>|null>(null);
export function FinanceProvider({children}:{children:ReactNode}) {const state=useFinanceState();return <FinanceContext.Provider value={state}>{children}</FinanceContext.Provider>;}
export function useFinance(){const value=useContext(FinanceContext);if(!value)throw new Error('FinanceProvider is required');return value;}
