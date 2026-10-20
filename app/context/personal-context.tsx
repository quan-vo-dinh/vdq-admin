'use client';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import useSWR from 'swr';
import { useTheme } from 'next-themes';
import { useLanguage } from './language-context';
export type Personal={firstName:string;lastName:string;email:string;phone:string;position:string;facebook:string;linkedin:string;github:string;instagram:string};
export type Address={location:string;state:string;pin:string;zip:string;taxNo:string};
type Profile={personal:Personal;address:Address;revision:number};
type Preferences={locale:'vi'|'en';theme:'light'|'dark';revision:number};
async function read<T>(url:string):Promise<T>{const r=await fetch(url);if(!r.ok)throw new Error('Không tải được dữ liệu cá nhân.');return r.json();}
export async function patchPersonal<T>(url:string,body:unknown):Promise<T>{const r=await fetch(url,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});if(!r.ok)throw new Error(r.status===409?'Dữ liệu đã thay đổi ở tab khác. Bản nháp được giữ; tải lại trước khi lưu.':'Không lưu được dữ liệu.');return r.json();}
function usePersonalState(){
 const profile=useSWR<Profile>('/api/profile',read,{refreshInterval:60000});
 const prefs=useSWR<Preferences>('/api/preferences',read,{refreshInterval:60000});
 const {language,setLanguage}=useLanguage();const {theme,setTheme}=useTheme();
 const [error,setError]=useState('');const [saving,setSaving]=useState(false);const lock=useRef(false);
 // Server is authoritative. Only explicit UI actions PATCH; hydration/focus never writes.
 useEffect(()=>{if(prefs.data){setLanguage(prefs.data.locale);setTheme(prefs.data.theme);}},[prefs.data,setLanguage,setTheme]);
 async function preferences(values:Partial<Pick<Preferences,'locale'|'theme'>>){
  if(!prefs.data||lock.current)return;lock.current=true;setSaving(true);setError('');
  try{const saved=await patchPersonal<Preferences>('/api/preferences',{...values,expectedRevision:prefs.data.revision});await prefs.mutate(saved,{revalidate:false});}
  catch(e){setError((e as Error).message);await prefs.mutate();}finally{lock.current=false;setSaving(false);}
 }
 return {profile,prefs,language,theme,preferences,error,saving};
}
const Context=createContext<ReturnType<typeof usePersonalState>|null>(null);
export function PersonalProvider({children}:{children:ReactNode}){const state=usePersonalState();return <Context.Provider value={state}>{state.error&&<p role="alert" className="p-2 text-destructive">{state.error}</p>}{children}</Context.Provider>;}
export function usePersonal(){const state=useContext(Context);if(!state)throw new Error('PersonalProvider required');return state;}
