/** Inclusive, date-only boundaries. All callers use the Finance Asia/Ho_Chi_Minh asOf date. */
export type FinanceDateRange = {from: string; to: string};
export type FinancePeriod = string | FinanceDateRange;
export type FinancePeriodMode = "calendar" | "recent-month";
const dayMs = 86_400_000;
const utc = (day: string) => new Date(`${day}T00:00:00Z`);
const key = (date: Date) => date.toISOString().slice(0,10);

export function calendarMonthRange(month: string): FinanceDateRange {
  const last = utc(`${month}-01`);
  last.setUTCMonth(last.getUTCMonth()+1,0);
  return {from:`${month}-01`,to:key(last)};
}
export function shiftCalendarMonth(day: string, amount: number) {
  const date = utc(day), originalDay = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth()+amount);
  const last = new Date(date);
  last.setUTCMonth(last.getUTCMonth()+1,0);
  date.setUTCDate(Math.min(originalDay,last.getUTCDate()));
  return key(date);
}
export function recentMonthRange(asOf: string): FinanceDateRange {
  return {from:shiftCalendarMonth(asOf,-1),to:asOf};
}
export function periodRange(period: FinancePeriod): FinanceDateRange {
  return typeof period === "string" ? calendarMonthRange(period) : period;
}
export function inFinancePeriod(day: string, period: FinancePeriod) {
  return typeof period === "string" ? day.startsWith(period) : day>=period.from && day<=period.to;
}
export function periodDays(period: FinancePeriod, asOf?: string) {
  const range=periodRange(period), end=asOf && asOf>=range.from && asOf<range.to ? asOf : range.to;
  const result:string[]=[];
  const endTime=utc(end).getTime();
  for(let time=utc(range.from).getTime();time<=endTime;time+=dayMs)result.push(key(new Date(time)));
  return result;
}
/** Split a rolling range across calendar months without changing stored monthly budgets. */
export function periodMonthShares(period: FinanceDateRange) {
  const result:{month:string;share:number}[]=[];
  let month=period.from.slice(0,7);
  while(month<=period.to.slice(0,7)) {
    const range=calendarMonthRange(month);
    const from=period.from>range.from?period.from:range.from;
    const to=period.to<range.to?period.to:range.to;
    const days=(utc(to).getTime()-utc(from).getTime())/dayMs+1;
    result.push({month,share:days/Number(range.to.slice(8))});
    if(month===period.to.slice(0,7))break;
    month=shiftCalendarMonth(range.from,1).slice(0,7);
  }
  return result;
}
