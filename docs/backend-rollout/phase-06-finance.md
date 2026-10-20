# P06 — Finance thật, giữ phép tính đúng

Bản tinh gọn v2, 2026-10-20. Đã triển khai local; gate CSV browser còn chờ quyền upload Chrome. [Evidence](evidence/P06.md). Phụ thuộc P05. Tiếp: [P07](phase-07-learning.md). Đây là phase lớn; có thể bàn giao sau 6A rồi tiếp 6B, không phải làm mọi thứ trong một phiên.

## Đầu ra cần đạt

Transactions, budgets, goals, accounts/bills và reports hiện có lưu/read thật. Ảnh goal hoàn thiện ở P08. Không bank API, multi-currency, double-entry ledger hoặc nhập dữ liệu tài chính demo.

## 6A — Schema/API và luồng giao dịch chính

1. Tables có UUID/owner/timestamps/revision: finance_accounts(name,opening_balance,note,archived_at); categories(code UNIQUE theo owner,name,kind income/expense); transactions(date,description,amount,kind,account_id,destination_account_id,category_id,source,ID).
2. finance_budgets(category_id UNIQUE theo owner,name,default_limit,fixed); budget_months(budget_id,month đầu tháng,limit,UNIQUE owner+budget+month); goals(name,target,allocated,monthly,deadline,priority,visual,image_path nullable); bills(name,due_on,amount).
3. Grants/RLS cùng owner; FKs cùng owner và CHECK amount/date/kind. Expense/refund dùng expense category, income dùng income category (có salary/freelance theo UI), transfer category null và source!=destination; adapter giữ chuỗi transfer cũ nếu UI cần.
4. VND nguyên numeric(18,0), read DTO tiền thành text trước JSON; safe-range adapter khi UI/chart cần Number, không parse số lớn rồi mới stringify. Tính tổng chính xác trong PostgreSQL hoặc integer-safe helper; ngoài range UI hỗ trợ trả lỗi rõ. Chưa làm thư viện tiền đa tiền tệ.
5. Giữ nguồn công thức lib/finance/model.ts: transfer không thay tổng tài sản, refund giảm net expense; opening có thể âm. allocated goal chỉ earmark, bills là dự kiến, fixed budget không tự sinh giao dịch.
6. /api/finance overview + resource mutations accounts/categories/transactions/budgets/goals/bills, không PUT toàn FinanceData. Account/category đã có history dùng archive/RESTRICT, không cascade xóa giao dịch.
7. Thay update(transform) trong finance-context bằng async resource actions và tất cả caller editor/budgets/goals/transactions. Báo saved sau commit, revision conflict giữ draft. Server ngày asOf theo VN và startsOn cấu hình; bỏ mốc ngày demo hardcode.
8. Overview/chart phải tính từ đủ lịch sử/khoảng thời gian liên quan, không lấy page transactions làm total. SQL aggregate/view an toàn RLS khi cần; chưa dựng reporting framework.

## 6B — CSV, budgets/goals và hoàn tất UI

1. Giữ CSV parser quoted/CRLF/BOM và chống formula injection export; server revalidate với accounts/categories thật. Giữ giới hạn CSV hiện có (amount <=1 tỷ, description <=150), không đổi hạn mức ngầm.
2. Một RPC transaction cho import batch bounded (ví dụ <=500 rows/1 MiB sau test runtime): finance_import_batches với owner+batch ID UNIQUE/hash/result, transaction rows gắn batch+row_index UNIQUE. Cùng key khác payload=409, retry cùng key không nhân bản. Không cần bảng import_rows riêng nếu fields trên transactions đủ.
3. Một row lỗi rollback cả batch. Duplicate heuristic chỉ cảnh báo; giao dịch trùng nội dung/ngày/tiền có thể hợp lệ. Không UNIQUE toàn lịch sử theo fingerprint.
4. Monthly budget override tách hàng, không ghi đè tháng khác; goal allocate/withdraw/deadline/monthly/visual giữ semantics. Image base64 không vào DB, hình riêng chờ P08.
5. Giữ API summary và list query đơn giản. Phân trang transactions khi cần, hạn mức page rõ; sum/report luôn toàn bộ range. Đừng chặn CRUD đầu tiên chỉ để làm cursor tối ưu.
6. Dữ liệu user bắt đầu rỗng, chỉ seed danh mục metadata mặc định idempotent cần cho form. Empty state cho account/transaction/goal, không fill demo balances khi DB chưa có data.

## User setup

Không setup cloud mới. User sẽ nhập số dư thật/ngày đầu kỳ sau P11; không gửi password/token ngân hàng. Ảnh riêng còn chờ U08, không chặn 6A.

## Kiểm tra bắt buộc và gate

- [x] CRUD transaction còn sau reload; transfer/refund/balance/net expense đúng fixtures; category/FK/amount/date/owner bị chặn khi sai.
- [x] Money round-trip và aggregate trong phạm vi hỗ trợ đúng, vượt safe chart range xử lý rõ; không bắt buộc một bộ BigInt framework cho mọi domain.
- [x] Revision edit/delete; CSV atomic + same-batch retry + two legitimate identical transactions.
- [x] Budget từng tháng, goal allocation và bills không tự chuyển tiền; reports đủ range, asOf thực đúng ngày.
- [ ] Chạy test:finance + API/SQL checks thêm đúng phần mới, browser editor/CSV/budget/goal/reports, lint/build cuối thay đổi frontend.
- [ ] Sau 6A có thể bàn giao CRUD/API đã đạt; chưa đánh dấu toàn P06 PASS cho đến khi 6B đạt.

## Hoãn / rollback

Không importer mock, ngân hàng sync, analytics service, audit ledger hoặc pagination engine chung. Khóa mutation/rollback app tương thích khi lỗi, không thay DB bằng financeDemo; import repair theo batch thay vì truncate bảng.
