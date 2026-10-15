"use client";
import { useLanguage } from "@/app/context/language-context";
export function useCalendarLocale() {
  const { language } = useLanguage();
  const vi = language === "vi";
  const text = (vietnamese: string, english: string) =>
    vi ? vietnamese : english;
  const date = (value: Date, options: Intl.DateTimeFormatOptions = {}) =>
    value.toLocaleDateString(vi ? "vi-VN" : "en-GB", options);
  return {
    vi,
    text,
    date,
    categories: {
      work: text("Công việc", "Work"),
      meeting: text("Cuộc họp", "Meetings"),
      personal: text("Cá nhân", "Personal"),
      learning: text("Học tập", "Learning"),
    },
    statuses: {
      planned: text("Dự kiến", "Planned"),
      confirmed: text("Đã xác nhận", "Confirmed"),
      completed: text("Hoàn thành", "Completed"),
      cancelled: text("Đã hủy", "Cancelled"),
    },
    priorities: {
      low: text("Thấp", "Low"),
      medium: text("Trung bình", "Medium"),
      high: text("Cao", "High"),
    },
    colors: {
      violet: text("Tím", "Violet"),
      blue: text("Xanh dương", "Blue"),
      green: text("Xanh lá", "Green"),
      orange: text("Cam", "Orange"),
      rose: text("Hồng", "Rose"),
      slate: text("Xám", "Slate"),
    },
    views: {
      agenda: text("Lịch trình", "Agenda"),
      year: text("Năm", "Year"),
      month: text("Tháng", "Month"),
      week: text("Tuần", "Week"),
      day: text("Ngày", "Day"),
    },
  };
}
