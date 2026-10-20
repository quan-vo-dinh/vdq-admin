"use client";

import { Suspense, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/app/context/language-context";
import { currentUser } from "@/lib/profile";
import { HeadingText } from "./heading-text";
import { cn } from "@/lib/utils";

const introductions: Record<string, [string, string, string, string]> = {
  "/developer": ["vibe code ít thôi cha!!", "Vibe coding không phải là một công việc. Đó là một hệ tư tưởng. Code chạy hay không không quan trọng, quan trọng là cái vibe lúc đó nó phải chill.", "bin, is GitHub green yet?", "A little commit, a little flex. Bugs can wait a minute."],
  "/developer/ai": ["bin và hội đồng AI cố vấn", "Token chạy hết công suất, mong deadline cũng chạy xa.", "bin and the AI advisory board", "Tokens at full speed. If only deadlines ran away too."],
  "/finance": ["bin ơi, ví còn thở không?", "Điểm danh tiền vào, truy tìm tiền ra. Không phán xét ly trà sữa.", "bin, is your wallet still breathing?", "Track money in, investigate money out. No judging the bubble tea."],
  "/finance/transactions": ["Tiền đi đâu rồi, bin?", "Mở lịch sử giao dịch, tìm thủ phạm. Spoiler: có thể là mình.", "Where did the money go, bin?", "Check the transaction history. Plot twist: it might be us."],
  "/finance/budgets": ["bin đặt kèo với chiếc ví", "Chia ngân sách trước, bớt câu ‘ủa hết tiền rồi à’ sau.", "bin versus the budget", "Plan first. Fewer ‘wait, where is my money?’ moments later."],
  "/finance/goals": ["bin nuôi heo đất, heo nuôi ước mơ", "Mỗi khoản để dành là một bước gần hơn tới nút chốt đơn.", "bin feeds the piggy bank", "Every little saving gets that checkout button closer."],
  "/finance/cash-flow": ["Dòng tiền chứ đừng dòng lệ, bin", "Canh ngày tiền về, né ngày ví về mo.", "Cash flow, not tears, bin", "Watch payday arrive before the wallet hits zero."],
  "/finance/simulator": ["bin thử giàu trong môi trường an toàn", "Cho quyết định chạy thử trước khi ví phải chạy chữa.", "bin takes a financial test drive", "Let the decision take a trial run before your wallet does."],
  "/apps/calendar": ["Lịch của bin", "Deadline không tự biến mất, nhưng mình có thể xếp nó cho đẹp.", "bin’s calendar", "Deadlines won’t disappear, but at least we can arrange them nicely."],
  "/apps/notes": ["", "bin ơi, ghi lại đi. Não có RAM, nhưng chưa chắc có autosave.", "", "Write it down, bin. Your brain has RAM, but autosave is not guaranteed."],
  "/pages/user-profile": ["", "Hồ sơ của bin: bản production, đôi lúc vẫn còn bug.", "", "bin’s profile: the production build, occasional bugs included."],
};

function routeIntro(path: string) {
  if (introductions[path]) return introductions[path];
  if (path.startsWith("/apps/blog")) return ["", "bin lên sóng: biến ý tưởng trong đầu thành bài có người đọc.", "", "bin goes live: turn brain tabs into something people can read."];
  if (path.startsWith("/apps/tickets")) return ["", "bin mở tổng đài: nhận bug, nhận việc, xin đừng nhận thêm drama.", "", "bin’s help desk: bugs welcome, extra drama optional."];
  return ["", "bin ơi, thêm một tab nữa là thành chuyên gia rồi.", "", "One more tab and you’re officially an expert, bin."];
}
function Intro({ taglineOnly = false, compact = false }: { taglineOnly?: boolean; compact?: boolean }) {
  const path = usePathname();
  const { language } = useLanguage();
  const entry = routeIntro(path);
  const title = entry[language === "vi" ? 0 : 2];
  const description = entry[language === "vi" ? 1 : 3].replaceAll("bin", currentUser.nickname);
  return <div className={cn("flex flex-col gap-1", compact && "h-16 min-w-0 flex-1 basis-0 justify-center gap-1")}>
    {!taglineOnly && title && <h1 className={cn("text-xl font-semibold", compact && "h-6 shrink-0 leading-6")}><HeadingText>{title.replaceAll("bin", currentUser.nickname)}</HeadingText></h1>}
    <p className={cn("text-sm font-normal text-muted-foreground", compact && "line-clamp-2 h-9 w-full max-w-[78ch] shrink-0 leading-[18px] break-words")} title={compact ? description : undefined}>{description}</p>
  </div>;
}
export function PersonalizedIntro({ taglineOnly = false, compact = false }: { taglineOnly?: boolean; compact?: boolean }) {
  return <Suspense fallback={null}><Intro taglineOnly={taglineOnly} compact={compact} /></Suspense>;
}
function subscribeTime(callback: () => void) {
  const timer = window.setInterval(callback, 60_000);
  return () => window.clearInterval(timer);
}
function greetingPeriod() {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ho_Chi_Minh", hour: "numeric", hourCycle: "h23" }).format(new Date()));
  return hour >= 5 && hour < 12 ? 0 : hour < 17 && hour >= 12 ? 1 : hour >= 17 && hour < 21 ? 2 : 3;
}
export function usePersonalGreeting() {
  const { language } = useLanguage();
  const period = useSyncExternalStore(subscribeTime, greetingPeriod, () => -1);
  const vi = ["Chào buổi sáng", "Chiều rồi", "Tối rồi", "Chúc ngủ ngon"];
  const en = ["Good morning", "Afternoon", "Good evening", "Good night"];
  const jokes = language === "vi"
    ? ["Nạp cà phê, mở dashboard, giả vờ mọi thứ trong tầm kiểm soát.", "Pin người còn bao nhiêu? Dashboard vẫn đang chạy nhé.", "Khép bớt tab công việc, mở tab cuộc đời một chút.", "Bug để mai sửa. Gối đang chờ pull request của bạn."]
    : ["Coffee in, dashboard open, everything totally under control. Probably.", "How much battery do you have left? The dashboard is still going.", "Close a few work tabs. Open a little life instead.", "The bugs can wait. Your pillow is waiting for your pull request."];
  return { title: `${period < 0 ? (language === "vi" ? "Chào" : "Hello") : (language === "vi" ? vi : en)[period]}, ${currentUser.nickname}`, subtitle: period < 0 ? "" : jokes[period], daytime: period === 0 || period === 1 };
}
