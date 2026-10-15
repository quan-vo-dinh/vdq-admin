import type { Metadata } from "next";
import BigCalendar from "@/app/components/apps/calendar";
export const metadata: Metadata = {
  title: "Big Calendar | Kế hoạch & lịch trình",
  description:
    "Quản lý lịch trình, sự kiện và công việc trong không gian lịch cá nhân.",
};
export default function CalendarPage() {
  return <BigCalendar />;
}
