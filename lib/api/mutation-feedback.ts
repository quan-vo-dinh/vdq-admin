/** Only operation metadata is broadcast; never include drafts or response data. */
export const MUTATION_FEEDBACK_EVENT = "dashboard:mutation-feedback";
export type MutationFeedback = {
  path: string;
  method: string;
  ok: boolean;
  status?: number;
  code?: string;
};
const resources: Record<string, [string, string]> = {
  "/api/notes": ["ghi chú", "note"],
  "/api/blog": ["bài viết", "post"],
  "/api/ticket": ["yêu cầu", "ticket"],
  "/api/calendar": ["lịch và kế hoạch", "calendar item"],
  "/api/today": ["công việc", "task"],
  "/api/userprofile/add-comments": ["bình luận", "comment"],
  "/api/userprofile/add-replies": ["phản hồi", "reply"],
  "/api/userprofile/replies-like": ["tương tác", "reaction"],
  "/api/profile": ["hồ sơ cá nhân", "profile"],
  "/api/preferences": ["tùy chọn", "preferences"],
  "/api/learning/habits": ["thói quen học tập", "learning habit"],
  "/api/learning/checkins": ["buổi học", "study session"],
  "/api/finance/projection": ["kế hoạch dòng tiền", "cash-flow plan"],
  "/api/finance/accounts": ["tài khoản", "account"],
  "/api/finance/categories": ["danh mục", "category"],
  "/api/finance/transactions": ["giao dịch", "transaction"],
  "/api/finance/budgets": ["ngân sách", "budget"],
  "/api/finance/budget_months": ["hạn mức tháng", "monthly limit"],
  "/api/finance/goals": ["mục tiêu tiết kiệm", "savings goal"],
  "/api/finance/goals/image": ["ảnh mục tiêu", "goal image"],
  "/api/finance/bills": ["khoản chi dự kiến", "upcoming bill"],
  "/api/finance/settings": ["thiết lập tài chính", "finance settings"],
  "/api/finance/checkpoints": ["mốc đối soát", "balance checkpoint"],
  "/api/finance/scope_events": ["phạm vi tiền theo dõi", "tracked funds"],
  "/api/finance/import": ["dữ liệu CSV", "CSV data"],
};
export function isCrudRequest(path: string, method: string) {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(method) && !!resources[path.split("?")[0]];
}
export function announceMutation(detail: MutationFeedback) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(MUTATION_FEEDBACK_EVENT, { detail }));
  }
}
export function mutationMessage(event: MutationFeedback, language: "vi" | "en") {
  const vi = language === "vi";
  const path = event.path.split("?")[0];
  const name = resources[path]?.[vi ? 0 : 1] ?? (vi ? "dữ liệu" : "data");
  if (event.ok) {
    if (path === "/api/finance/import") return vi ? "Đã nhập dữ liệu CSV." : "CSV data imported.";
    const verb = event.method === "DELETE" ? (vi ? "Đã xóa" : "Deleted")
      : event.method === "POST" ? (vi ? "Đã lưu" : "Saved") : (vi ? "Đã cập nhật" : "Updated");
    return `${verb} ${name}.`;
  }
  if (event.status === 401) return vi ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." : "Your session has expired. Please sign in again.";
  if (event.code === "category_has_transactions" || event.code === "category_has_history") return vi ? "Danh mục đang có giao dịch nên không thể xóa." : "This category has transactions and cannot be deleted.";
  if (event.code === "duplicate_transaction") return vi ? "Giao dịch bị trùng. Chưa nhập thêm dữ liệu." : "Duplicate transaction. No additional data imported.";
  if (event.status === 409) return vi ? "Dữ liệu đã thay đổi hoặc đang được sử dụng. Giữ bản nháp và tải lại trước khi thử tiếp." : "Data has changed or is in use. Keep your draft and reload before retrying.";
  if (!event.status) return vi ? "Chưa xác nhận được thao tác do lỗi kết nối. Kiểm tra lại dữ liệu trước khi thử lại." : "The operation could not be confirmed due to a connection error. Check the data before retrying.";
  return vi ? `Không lưu được ${name}. Kiểm tra thông tin và thử lại.` : `Could not save ${name}. Check the details and try again.`;
}
