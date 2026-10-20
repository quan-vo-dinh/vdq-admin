"use client";
import {useState} from 'react';
import {useFinance} from '@/app/context/finance-context';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {todayKey} from '@/lib/learning/model';
export function FinanceManage(){
 const {data,action,busy}=useFinance();const [open,setOpen]=useState(false);
 const [resource,setResource]=useState('accounts'),[id,setId]=useState(()=>crypto.randomUUID()),[expected,setExpected]=useState<number>();
 const [name,setName]=useState(''),[amount,setAmount]=useState('0'),[note,setNote]=useState(''),[date,setDate]=useState(()=>todayKey()),[error,setError]=useState('');
 function reset(next:string){setResource(next);setId(crypto.randomUUID());setExpected(undefined);setName('');setAmount('0');setNote('');setDate(next==='settings'?data!.startsOn:todayKey());setError('');}
 if(!data)return null;
 return <><Button size="sm" variant="outline" onClick={()=>setOpen(true)}>Tài khoản & khoản dự kiến</Button><Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[85dvh] overflow-auto"><DialogHeader><DialogTitle>Thiết lập tài chính</DialogTitle><DialogDescription>Số dư đầu kỳ và ngày bắt đầu báo cáo. Khoản dự kiến không tự tạo giao dịch.</DialogDescription></DialogHeader>
 <div className="flex gap-2">{[['accounts','Tài khoản'],['bills','Khoản dự kiến'],['settings','Ngày đầu kỳ']].map(([key,label])=><Button key={key} variant={resource===key?'default':'outline'} onClick={()=>reset(key)}>{label}</Button>)}</div>
 {error&&<p role="alert">{error}</p>}
 <form className="flex flex-col gap-3" onSubmit={async e=>{e.preventDefault();try{await action(resource,resource==='settings'||expected?'PATCH':'POST',resource==='settings'?{id:data.settings!.id,expectedRevision:data.settings!.revision,starts_on:date}:resource==='accounts'?{id,expectedRevision:expected,name,opening:amount,note}:{id,expectedRevision:expected,name,amount,due_on:date});reset(resource);}catch(e){setError(e instanceof Error?e.message:'Không lưu được.');}}}>
 {resource!=='settings'&&<><label>Tên<Input aria-label="Tên tài khoản hoặc khoản dự kiến" required maxLength={80} value={name} onChange={e=>setName(e.target.value)}/></label><label>{resource==='accounts'?'Số dư đầu kỳ (có thể âm)':'Số tiền dự kiến'}<Input aria-label="Số tiền VND" required type="number" step="1" value={amount} onChange={e=>setAmount(e.target.value)}/></label></>}
 {resource==='accounts'?<label>Ghi chú<Input value={note} onChange={e=>setNote(e.target.value)}/></label>:<label>{resource==='settings'?'Ngày đầu kỳ':'Ngày đến hạn'}<Input type="date" required value={date} onChange={e=>setDate(e.target.value)}/></label>}
 <Button disabled={busy} type="submit">Lưu {expected?'thay đổi':''}</Button></form>
 {resource==='accounts'&&data.accounts.map(a=><div key={a.id} className="flex items-center justify-between gap-2"><span>{a.name} · {a.opening.toLocaleString('vi-VN')} ₫ {a.archivedAt?'(lưu trữ)':''}</span><Button variant="ghost" disabled={busy} onClick={()=>{setId(a.id);setExpected(a.revision);setName(a.name);setAmount(String(a.opening));setNote(a.note);}}>Sửa</Button><Button variant="outline" disabled={busy||!!a.archivedAt} onClick={async()=>{try{await action('accounts','PATCH',{id:a.id,expectedRevision:a.revision,archived_at:new Date().toISOString()});}catch{}}}>Lưu trữ</Button></div>)}
 {resource==='bills'&&data.bills.map(b=><div key={b.id} className="flex items-center justify-between gap-2"><span>{b.name} · {b.date}</span><Button variant="ghost" onClick={()=>{setId(b.id);setExpected(b.revision);setName(b.name);setAmount(String(b.amount));setDate(b.date);}}>Sửa</Button><Button variant="outline" disabled={busy} onClick={async()=>{try{await action('bills','DELETE',{id:b.id,expectedRevision:b.revision});}catch{}}}>Xóa</Button></div>)}
 </DialogContent></Dialog></>;
}
