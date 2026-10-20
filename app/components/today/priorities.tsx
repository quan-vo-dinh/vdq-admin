"use client";
import { useState } from "react";
import { ArrowRight, Check, Plus, Target, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToday } from "@/app/context/today-context";
import { categories, nextDay, type Priority } from "@/lib/today/model";
import { cn } from "@/lib/utils";
import { Panel, Message, useTodayLocale } from "./shared";
export function Priorities({ day }: { day: string }) {
  const { text } = useTodayLocale();
  const { items, change, busy, error, isLoading, reload } = useToday();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Priority["category"]>("work");
  const [notice, setNotice] = useState("");
  const [failure, setFailure] = useState("");
  const current = items.filter(item => item.date === day);
  const tomorrow = day ? nextDay(day) : "";
  const waiting = items.filter(item => !item.done && (item.date < day || item.date === tomorrow));
  const completed = current.filter(item => item.done).length;
  const label = (value: Priority["category"]) => value === "work" ? text("Công việc", "Work") : value === "personal" ? text("Cá nhân", "Personal") : text("Học tập", "Learning");
  async function run(method: "POST" | "PATCH" | "DELETE", body: Record<string, unknown>, success: string) {
    setFailure(""); setNotice("");
    try { await change(method, body); setNotice(success); return true; }
    catch (error) { setFailure(error instanceof Error && error.message === "full" ? text("Ngày đó đã đủ 3 việc. Hãy để dành một chỗ trước nhé.", "That day already has three priorities. Free a slot first.") : text("Chưa lưu được thay đổi. Thử lại nhé.", "Could not save changes. Please retry.")); return false; }
  }
  return <Panel icon={<Target className="size-4" />} title={text("Ba việc hôm nay", "Today’s three priorities")} description={text("Ít thôi, nhưng làm tới nơi tới chốn.", "A little less, a little more done.")} action={<span className="font-mono text-sm text-muted-foreground">{completed}/3</span>}>
    <div className="space-y-4">
      {(isLoading || !day) ? <Message>{text("Đang mở sổ…", "Opening your planner…")}</Message> : error ? <div className="space-y-2"><Message error>{text("Chưa tải được việc hôm nay.", "Could not load priorities.")}</Message><Button variant="outline" onClick={() => reload()}>{text("Thử lại", "Retry")}</Button></div> : <>
        <div className="space-y-2">
          {current.map((item, index) => <div key={item.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
            <span className="pt-0.5 font-mono text-xs text-muted-foreground">0{index + 1}</span>
            <Checkbox className="mt-0.5" checked={item.done} disabled={busy} aria-label={text("Hoàn thành: ", "Complete: ") + item.title} onCheckedChange={done => void run("PATCH", { id: item.id, action: "toggle", done }, done ? text("Xong một việc. Đỉnh!", "One down. Nice!") : text("Đã mở lại việc.", "Priority reopened."))} />
            <div className="min-w-0 flex-1"><p className={cn("break-words font-medium", item.done && "text-muted-foreground line-through")}>{item.title}</p><span className="text-xs text-muted-foreground">{label(item.category)}</span></div>
            <div className="flex shrink-0 gap-1">{!item.done && <Button variant="ghost" size="icon-sm" disabled={busy} title={text("Để mai làm", "Move to tomorrow")} aria-label={text("Chuyển sang ngày mai: ", "Move to tomorrow: ") + item.title} onClick={() => void run("PATCH", { id: item.id, action: "move", date: tomorrow }, text("Đã chuyển sang ngày mai.", "Moved to tomorrow."))}><ArrowRight /></Button>}<Button variant="ghost" size="icon-sm" disabled={busy} aria-label={text("Bỏ việc: ", "Remove priority: ") + item.title} onClick={() => void run("DELETE", { id: item.id }, text("Đã bỏ việc khỏi danh sách.", "Priority removed."))}><Trash2 /></Button></div>
          </div>)}
          {Array.from({ length: 3 - current.length }, (_, index) => <div key={index} className="flex min-h-16 items-center gap-3 rounded-lg border border-dashed border-border px-3 text-muted-foreground"><span className="font-mono text-xs">0{current.length + index + 1}</span><p className="text-sm">{text("Một chỗ cho điều quan trọng.", "Room for something that matters.")}</p></div>)}
        </div>
        {completed === 3 && <p className="flex items-center gap-2 text-sm text-primary"><Check className="size-4" />{text("Hôm nay đủ giỏi rồi. Nghỉ một chút nhé.", "You did enough today. Take a breather.")}</p>}
        <form className="space-y-2" onSubmit={async event => { event.preventDefault(); if (await run("POST", { title, category, date: day }, text("Đã thêm vào hôm nay.", "Added to today."))) setTitle(""); }}>
          <label htmlFor="today-priority" className="sr-only">{text("Việc quan trọng hôm nay", "Today’s priority")}</label>
          <Input id="today-priority" placeholder={text("Hôm nay mình muốn làm xong…", "Today I want to finish…")} maxLength={160} value={title} onChange={event => setTitle(event.target.value)} disabled={busy || current.length >= 3} />
          <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex gap-1" role="group" aria-label={text("Nhóm công việc", "Priority category")}>{categories.map(value => <Button key={value} type="button" size="sm" variant={value === category ? "secondary" : "ghost"} aria-pressed={value === category} onClick={() => setCategory(value)}>{label(value)}</Button>)}</div><Button type="submit" disabled={busy || !title.trim() || current.length >= 3}><Plus />{text("Thêm việc", "Add priority")}</Button></div>
          {current.length >= 3 && <p className="text-xs text-muted-foreground">{text("Đủ 3 việc rồi. Bỏ hoặc chuyển một việc nếu cần thay đổi.", "Three is enough. Remove or move one to make room.")}</p>}
        </form>
        {waiting.length > 0 && <details className="border-t border-border pt-3"><summary className="cursor-pointer text-sm text-muted-foreground">{text("Việc còn chờ & ngày mai", "Waiting & tomorrow")} · {waiting.length}</summary><div className="mt-3 max-h-52 space-y-3 overflow-y-auto">{waiting.map(item => <div key={item.id} className="flex items-center gap-2"><div className="min-w-0 flex-1"><p className="break-words text-sm">{item.title}</p><span className="text-xs text-muted-foreground">{item.date === tomorrow ? text("Ngày mai", "Tomorrow") : item.date}</span></div><Button variant="outline" size="sm" disabled={busy || current.length >= 3} onClick={() => void run("PATCH", { id: item.id, action: "move", date: day }, text("Đã đưa vào hôm nay.", "Moved to today."))}>{text("Hôm nay", "Today")}</Button><Button variant="ghost" size="icon-sm" disabled={busy} aria-label={text("Bỏ việc: ", "Remove priority: ") + item.title} onClick={() => void run("DELETE", { id: item.id }, text("Đã bỏ việc.", "Priority removed."))}><Trash2 /></Button></div>)}</div></details>}
      </>}
      {failure && <Message error>{failure}</Message>}{notice && <Message>{notice}</Message>}
    </div>
  </Panel>;
}
