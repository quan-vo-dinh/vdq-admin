"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Language = "vi" | "en";

const vietnamese: Record<string, string> = {
  "Big Calendar": "Lịch & kế hoạch",
  "Dashboard": "Bảng điều khiển", "Modern": "Tổng quan", "Pages": "Trang", "Apps": "Ứng dụng",
  "User Profile": "Hồ sơ cá nhân", "Notes": "Ghi chú", "Blogs": "Bài viết", "Blog Listing": "Danh sách bài viết",
  "Blog Detail": "Chi tiết bài viết", "Blog Edit": "Sửa bài viết", "Blog Create": "Tạo bài viết",
  "Manage Blog": "Quản lý bài viết", "Tickets": "Yêu cầu hỗ trợ", "Auth": "Xác thực",
  "Error": "Lỗi", "Login": "Đăng nhập", "Boxed Login": "Đăng nhập", "Register": "Đăng ký",
  "Boxed Register": "Đăng ký", "Forgot Password": "Quên mật khẩu", "Boxed Forgot Pwd": "Quên mật khẩu",
  "Two Steps": "Xác thực hai bước", "Boxed Two Steps": "Xác thực hai bước",
  "Home": "Trang chủ", "Profile": "Hồ sơ", "Notifications": "Thông báo", "new": "mới",
  "See All Notifications": "Xem tất cả thông báo", "Search....": "Tìm kiếm...",
  "No Components Found!": "Không tìm thấy mục nào!", "Page error": "Lỗi trang",
  "Notes app": "Ứng dụng ghi chú", "Edit Note": "Sửa ghi chú", "Add Note": "Thêm ghi chú",
  "Add New Note": "Thêm ghi chú mới", "Write your note here...": "Viết ghi chú tại đây...",
  "Change Note Color": "Đổi màu ghi chú", "Save": "Lưu", "Close": "Đóng",
  "Select a Note": "Chọn một ghi chú", "All Notes": "Tất cả ghi chú",
  "Search Notes...": "Tìm ghi chú...", "Find Your Notes...": "Tìm ghi chú của bạn...",
  "Look up Notes...": "Tra cứu ghi chú...", "Delete note": "Xóa ghi chú", "Delete": "Xóa",
  "No Notes Found!": "Không tìm thấy ghi chú!", "Log Out": "Đăng xuất",
  "View portfolio": "Xem portfolio", "Full-stack Engineer": "Kỹ sư Full-stack",
  "Hi, I'm bin": "Xin chào, mình là bin", "About me": "Giới thiệu",
  "Full-stack Engineer working with ASP.NET Core and React, with a foundation in Node.js, Next.js, and NestJS.":
    "Kỹ sư Full-stack làm việc với ASP.NET Core và React, có nền tảng về Node.js, Next.js và NestJS.",
  "Switch language": "Đổi ngôn ngữ", "Toggle sidebar": "Ẩn/hiện thanh bên",
  "Toggle theme": "Đổi giao diện", "Open profile": "Mở hồ sơ",
  "Good Morning": "Chào buổi sáng", "Good Afternoon": "Chào buổi chiều",
  "Good Evening": "Chào buổi tối", "Good Night": "Chúc ngủ ngon",
  "Stay informed with today’s analytics": "Theo dõi số liệu hôm nay",
  "Monthly": "Hàng tháng", "Yearly": "Hàng năm", "Export": "Xuất dữ liệu",
  "Event Today": "Sự kiện hôm nay", "Just a reminder that you have event": "Bạn có sự kiện cần chú ý",
  "Settings": "Cài đặt", "You can customize this template as you want": "Bạn có thể tùy chỉnh giao diện",
  "Launch Admin": "Khởi chạy bảng điều khiển", "Just see the my new admin!": "Xem bảng điều khiển mới",
  "Personal Information": "Thông tin cá nhân", "Address Details": "Thông tin địa chỉ",
  "First Name": "Tên đệm", "Last Name": "Tên", "Email": "Email", "Phone": "Số điện thoại",
  "Position": "Vai trò", "Edit": "Chỉnh sửa", "Location": "Địa điểm",
  "Province / State": "Tỉnh / Thành phố", "PIN Code": "Mã PIN", "ZIP": "Mã bưu chính",
  "Federal Tax No.": "Mã số thuế", "Edit Personal Information": "Chỉnh sửa thông tin cá nhân",
  "Edit Address Details": "Chỉnh sửa địa chỉ", "Save Changes": "Lưu thay đổi",
  "Facebook URL": "Liên kết Facebook", "Twitter URL": "Liên kết Twitter",
  "GitHub URL": "Liên kết GitHub", "Dribbble URL": "Liên kết Dribbble",
  "LinkedIn URL": "Liên kết LinkedIn", "Instagram URL": "Liên kết Instagram",
  "Workplace": "Nơi làm việc", "Education": "Học vấn", "Information Systems": "Hệ thống Thông tin",
};

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (text: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("vi");

  useEffect(() => {
    const stored = window.localStorage.getItem("dashboard-language");
    if (stored === "en" || stored === "vi") setLanguage(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem("dashboard-language", language);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: (text) => language === "vi" ? vietnamese[text] ?? text : text }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
