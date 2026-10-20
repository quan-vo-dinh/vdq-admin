# P07 — Learning habits và check-ins

Bản tinh gọn v2, 2026-10-20. Chưa triển khai. Phụ thuộc P06. Tiếp: [P08](phase-08-profile-preferences-storage.md).

## Đầu ra cần đạt

Giữ trang /apps/tickets hiện render LearningApp, thay local state bằng data bền. Không dựng backend /api/ticket template hay import streak/check-in demo.

## Đầu việc

1. learning_habits(id UUID,owner_id,title,intention,target_minutes 1..1440,started_on,archived,timestamps,revision); learning_checkins(id,owner_id,habit_id,checked_on DATE,minutes 1..1440,note,timestamps,revision).
2. Composite owner FK + UNIQUE(owner,habit,date); indexes theo habit/date và owner/date. Archive habit thay xóa history; không thêm delete UI nếu hiện không có.
3. /api/learning/habits và /checkins, create/edit/archive/check-in/undo theo thao tác UI. Server xác định ngày Asia/Ho_Chi_Minh, cùng ngày thay minutes/note, không cộng entry.
4. Supabase CRUD đơn giản + expectedRevision. Chỉ dùng RPC/transaction cho check-in nếu cần kiểm tra archived + upsert nguyên tử; khóa habit/check-in nhất quán, không thêm generic command bus.
5. Unique tránh duplicate ngày, stale update/undo trả 409; archived habit không nhận check-in cả khi gọi write path trực tiếp. Grant write/RPC phù hợp để không bỏ qua invariant này.
6. Context async + SWR dùng loading/error/busy, giữ draft khi fail; không fallback createLearningDemo. Celebration chỉ sau commit thành công.
7. Giữ streaks/learningSummary hiện tại làm công thức; cho dữ liệu cá nhân nhỏ có thể lấy lịch sử date/minutes đủ dùng, chưa cần SQL report engine. Không tính current/best từ một page bị cắt.
8. Tab qua 00:00 VN/focus refresh ngày; không thêm backdate, reminder scheduling, habit version history.

## User setup

Không setup tài khoản ngoài. User tạo habit thật sau deploy; không chờ xác minh/import dữ liệu demo nữa.

## Kiểm tra bắt buộc và gate

- [ ] Create/edit/archive và check-in/undo còn sau reload/tab khác.
- [ ] Một entry/ngày, archived deny, stale undo không xóa entry mới sửa; owner/non-owner policy.
- [ ] Streak gap/hôm nay/hôm qua và ngày qua tháng/năm theo helper hiện có; minutes 1..1440.
- [ ] Module test/DB invariant mới, browser luồng chính history/check-in, lint/build cuối frontend change. Không chạy lại Finance/Notes nếu không chạm shared code.

## Hoãn / rollback

Không import demo, counters streak dư thừa, event history hoặc reporting framework. Lỗi thì giữ DB/draft và rollback code tương thích; không hiện streak giả khi API lỗi.
