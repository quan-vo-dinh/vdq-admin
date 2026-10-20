# P05 — Calendar lưu bền

Đính chính theo user ngày 2026-10-20: **không có trang Today**. P05 chỉ gồm Calendar và settings.
Calendar persistence đã PASS local; [evidence](evidence/P05.md) có ghi rõ phần thử nghiệm Today cũ đã bị loại khỏi scope.
Phụ thuộc P04. Tiếp: [P06](phase-06-finance.md). Giữ tên file hiện tại để không phá liên kết lịch sử.

## Đầu ra cần đạt

Calendar tại `/apps/calendar` dùng database, giữ các view agenda/year/month/week/day và settings hiện có.
Không tạo `/today`, không thêm Quick Note/priorities/Activity hoặc chuyển chúng sang trang khác.
Không import event demo; không thêm recurrence/invite/team calendar.

## Schema và công việc

1. calendar_events giữ title/description/color/category/kind/status/priority/location/attendees và timestamps/revision.
   Timed dùng starts_at/ends_at timestamptz; all-day dùng starts_on/ends_on DATE, end exclusive.
   CHECK chỉ một biểu diễn và end>start, index owner+thời điểm/ngày.
2. Explicit grants/RLS owner-only; Calendar CRUD qua user JWT, owner check trong DAL.
   Update/delete ID+owner+expectedRevision nguyên tử, 409 giữ draft; create UUID ổn định cho retry.
3. calendar_settings một hàng mỗi owner có revision, default tạo idempotent;
   badge/work hours/visible hours/weekends/workDays theo validator hiện có. Attendees vẫn là text.
4. Adapter CalendarEvent.start/end local ↔ DB cố định Asia/Ho_Chi_Minh, timed UTC offset rõ;
   all-day giữ DATE. Không dựa timezone host/browser.
5. Giữ `/api/calendar`, context và SWR keys hiện có. Query overlap theo window để có cả event bắt đầu trước window.
   Không dựng provider/runtime trùng hoặc fallback filesystem/seed events khi DB lỗi.
6. Giữ các caller Calendar hiện có; không suy ra phải dựng dashboard/widget Today chỉ vì còn source chưa mount.

## User setup

Không có tài khoản ngoài mới hoặc Google Calendar permission. Không nhập demo.

## Kiểm tra bắt buộc và gate

- [x] Calendar owner CRUD/revision/retry, anon/non-owner/RLS được bảo vệ.
- [x] Timed/all-day/overlap qua nửa đêm/tháng đúng, giữ timezone VN và exclusive end.
- [x] Move/end-time edit/settings/ICS giữ semantics hiện có qua unit/API; native pointer drag chưa xác minh thành công,
  ghi giới hạn trong evidence, có thể recheck ở P10. UI hiện tại không có resize handle.
- [x] Reload và app process restart giữ dữ liệu.
- [x] test:calendar 14/14, policy/SQL tests, browser Calendar desktop/mobile, scoped lint/build PASS;
  full lint có baseline riêng.

## Dọn phần hiểu nhầm và rollback

Route/menu Today đã xóa theo user. Source/API/schema Today local cũ không là scope active hoặc gate release.
Không drop dữ liệu hay sửa migration đã áp dụng chỉ để xóa trang. Migration local gộp
`20261020000400_notes_today_calendar.sql` và RPC guard `20261020000500_today_revision_guard.sql`
cần được rà/tách khỏi luồng migration cloud trước P11; không áp nguyên xi phần Today lên production.
Forward fix tương thích DB nếu cần; không dual-write file/DB hoặc restore demo ghi đè record thật.
