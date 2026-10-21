"use client";
import { apiFetch } from "@/lib/api/transport";
import {createContext,useContext,useEffect,useRef,useState,useSyncExternalStore,type ReactNode} from 'react';
import useSWR from 'swr';
import {getFetcher} from '@/app/api/global-fetcher';
import {todayKey,streaks,milestones} from '@/lib/learning/model';
import type {LearningData,HabitValues} from '@/lib/learning/types';
function subscribe(callback:()=>void){const timer=setInterval(callback,15000);return()=>clearInterval(timer);}
function useLearningState(){
 const today=useSyncExternalStore(subscribe,todayKey,todayKey);
 const {data:loaded,error,mutate,isLoading}=useSWR<LearningData & {today:string}>('/api/learning/habits',getFetcher);
 useEffect(()=>{void mutate();},[today,mutate]);
 const [busy,setBusy]=useState(false),[failure,setFailure]=useState('');const lock=useRef(false);
 const data=loaded??{version:1 as const,today,habits:[]};
 async function action(resource:string,method:string,body:Record<string,unknown>){
  if(lock.current)throw new Error('Đang lưu.');lock.current=true;setBusy(true);setFailure('');
  try{const r=await apiFetch('/api/learning/'+resource,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});if(!r.ok)throw new Error(r.status===409?'Dữ liệu/ngày đã thay đổi. Bản nháp được giữ; tải lại rồi mở lại để cập nhật.':'Không lưu được buổi học.');const next=await r.json();await mutate(next,false);return next as typeof data;}
  catch(e){setFailure(e instanceof Error?e.message:'Không lưu được.');throw e;}finally{lock.current=false;setBusy(false);}
 }
 async function createHabit(values:HabitValues,id:string){await action('habits','POST',{...values,id});}
 async function editHabit(id:string,values:HabitValues,expectedRevision?:number){await action('habits','PATCH',{...values,id,expectedRevision});}
 async function setArchived(id:string,archived:boolean,expectedRevision?:number){await action('habits','PATCH',{id,archived,expectedRevision});}
 async function undoCheckIn(id:string,entry:{id?:string;revision?:number;date:string}) {await action('checkins','DELETE',{id:entry.id,habitId:id,date:entry.date,expectedRevision:entry.revision,minutes:1,note:''});}
 async function checkIn(id:string,minutes:number,note:string,entry:{id?:string;revision?:number}|undefined,date:string,createId:string){
  const next=await action('checkins','POST',{id:entry?.id??createId,habitId:id,date,expectedRevision:entry?.revision??0,minutes,note});
  const h=next.habits.find(h=>h.id===id)!;const days=streaks(h.entries,next.today).current;
  return entry?null:{title:h.title,days,milestone:milestones.includes(days)||days%365===0};
 }
 return {data:{...data,today},error,failure,isLoading,loaded:!!loaded,busy,createHabit,editHabit,setArchived,undoCheckIn,checkIn};
}
const LearningContext=createContext<ReturnType<typeof useLearningState>|null>(null);
export function LearningProvider({children}:{children:ReactNode}){const state=useLearningState();return <LearningContext.Provider value={state}>{children}</LearningContext.Provider>;}
export function useLearning(){const context=useContext(LearningContext);if(!context)throw new Error('LearningProvider required');return context;}
