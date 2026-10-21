'use client';
import { apiFetch } from "@/lib/api/transport";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import useSWR from 'swr';
import { useTheme } from 'next-themes';
import { useLanguage } from './language-context';
export type Personal={firstName:string;lastName:string;email:string;phone:string;position:string;facebook:string;linkedin:string;github:string;instagram:string};
export type Address={location:string;state:string;pin:string;zip:string;taxNo:string};
type Profile={personal:Personal;address:Address;revision:number};
type Preferences={locale:'vi'|'en';theme:'light'|'dark';revision:number};
async function read<T>(url:string):Promise<T>{const r=await apiFetch(url);if(!r.ok)throw new Error('Không tải được dữ liệu cá nhân.');return r.json();}
export async function patchPersonal<T>(url:string,body:unknown):Promise<T>{
 const response=await apiFetch(url,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 if(!response.ok){
  const result=await response.json().catch(()=>({}));
  const messages:Record<string,string>={
   invalid_url:'Liên kết mạng xã hội không hợp lệ. Nhập tên miền như github.com/tai-khoan hoặc URL https:// đầy đủ.',
   invalid_email:'Địa chỉ email không hợp lệ.',
   conflict:'Dữ liệu đã thay đổi ở tab khác. Bản nháp được giữ; đóng và mở lại để tải phiên bản mới.',
   invalid:'Một trường thông tin không hợp lệ hoặc dài quá 500 ký tự.',
  };
  throw new Error(messages[result.code] ?? (response.status===401?'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.':'Không lưu được dữ liệu. Vui lòng thử lại.'),{cause:response.status});
 }
 return response.json();
}

function usePersonalState(){
 const profile=useSWR<Profile>('/api/profile',read,{refreshInterval:60000});
 const prefs=useSWR<Preferences>('/api/preferences',read,{refreshInterval:60000});
 const {language,setLanguage}=useLanguage();const {theme,setTheme}=useTheme();
 const [error,setError]=useState('');const [saving,setSaving]=useState(false);const lock=useRef(false);const themeTransition=useRef(false);
 // Server is authoritative. Only explicit UI actions PATCH; hydration/focus never writes.
 useEffect(()=>{if(prefs.data){setLanguage(prefs.data.locale);if(!themeTransition.current)setTheme(prefs.data.theme);}},[prefs.data,setLanguage,setTheme]);
 async function preferences(values:Partial<Pick<Preferences,'locale'|'theme'>>, applyTheme?: (theme: Preferences['theme']) => Promise<void>){
  if(!prefs.data||lock.current)return;lock.current=true;themeTransition.current=!!values.theme;setSaving(true);setError('');
  try{
   let saved:Preferences;
   try{saved=await patchPersonal<Preferences>('/api/preferences',{...values,expectedRevision:prefs.data.revision});}
   catch(e){
    // A second open tab can advance the revision. Retry this explicit preference
    // once against current data, preserving all fields the user did not change.
    if(!(e instanceof Error)||e.cause!==409)throw e;
    const latest=await read<Preferences>('/api/preferences');
    saved=await patchPersonal<Preferences>('/api/preferences',{...values,expectedRevision:latest.revision});
   }
   await prefs.mutate(saved,{revalidate:false});
   if(values.theme){if(applyTheme)await applyTheme(saved.theme);else setTheme(saved.theme);}
  }
  catch(e){setError((e as Error).message);const latest=await prefs.mutate();if(latest)setTheme(latest.theme);}finally{themeTransition.current=false;lock.current=false;setSaving(false);}
 }
 return {profile,prefs,language,theme,preferences,error,saving};
}
const Context=createContext<ReturnType<typeof usePersonalState>|null>(null);
export function PersonalProvider({children}:{children:ReactNode}){const state=usePersonalState();return <Context.Provider value={state}>{state.error&&<p role="alert" className="p-2 text-destructive">{state.error}</p>}{children}</Context.Provider>;}
export function usePersonal(){const state=useContext(Context);if(!state)throw new Error('PersonalProvider required');return state;}
