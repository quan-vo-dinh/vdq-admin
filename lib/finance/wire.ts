// Money crosses the API boundary as decimal text. UI numbers are range checked.
const moneyKeys = new Set(['opening','amount','limit','target','allocated','monthly']);
export function financeWire(value: unknown): unknown {
 if(Array.isArray(value))return value.map(financeWire);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,key==='monthlyLimits'&&item?Object.fromEntries(Object.entries(item).map(([month,n])=>[month,String(n)])):moneyKeys.has(key)?String(item):financeWire(item)]));
 return value;
}
export function financeNumbers(value: unknown): unknown {
 if(Array.isArray(value))return value.map(financeNumbers);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,key==='monthlyLimits'&&item?Object.fromEntries(Object.entries(item).map(([month,n])=>[month,safe(n)])):moneyKeys.has(key)?safe(item):financeNumbers(item)]));
 return value;
}
function safe(value:unknown){if(typeof value!=='string'||! /^-?\d+$/.test(value)||!Number.isSafeInteger(Number(value)))throw new Error('Tiền vượt phạm vi UI hỗ trợ.');return Number(value);}
