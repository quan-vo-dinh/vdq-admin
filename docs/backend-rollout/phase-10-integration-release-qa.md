# P10 — Một vòng kiểm thử release

Bản tinh gọn v2, 2026-10-20. PASS local; xem evidence/P10.md cho gate cuối. Phụ thuộc P09. Tiếp: [P11](phase-11-production-deployment.md).

## Đầu ra cần đạt

Một release candidate đủ an toàn để deploy: kiểm tra luồng nối giữa module và regression, dùng lại tests/evidence đã đạt. Không kiểm tra lại toàn bộ từ đầu trong mỗi phase và không xây CI chỉ để chạy được một vòng QA.

## Công việc

1. Tái sử dụng local scripts, test harness và dữ liệu tổng hợp đang có; không viết auth harness/fixture runner khác. Đọc evidence gần nhất để chọn tests còn thiếu hoặc bị ảnh hưởng.
2. Chạy pnpm lint và pnpm build một lần trên trạng thái cuối. Baseline cũ đã ghi: lint 21 errors/45 warnings, Developer fail 1/7; chỉ dùng như mốc đối chiếu, không xem mọi lỗi tương tự đều là cũ. Lỗi mới/security/type/integrity phải sửa.
3. Chạy module tests Notes/Calendar/Finance/Learning cùng RLS/auth suite đã tạo; không mở rộng Developer/Blog tests ngoài kiểm tra shared regression cần thiết.
4. Browser một vòng desktop + một viewport mobile: login → Notes → Calendar (gồm agenda view) → Finance/CSV/budget/goal/image → Learning → Profile/Preferences → logout.
5. Kiểm tra reload/tab khác và app production build chạy cùng DB; dữ liệu không mất khi đổi process. Cần kiểm tra trong phase nào đã có đủ thì tham chiếu evidence, chỉ rerun nếu code/schema đã đổi.
6. Auth/RLS direct access anon/non-owner, cookie refresh/callback, CSRF Origin, no-store/cache và endpoint ngoài scope. Đây là kiểm tra bảo vệ dữ liệu, không cắt vì muốn nhanh.
7. Rerun Finance totals/import atomic/retry, Learning uniqueness nếu thay đổi từ phase trước hoặc như regression cuối trên suite chung; không dựng stress/benchmark/fault injection matrix.
8. Backup/restore đã đạt P09 và không đổi schema thì tham chiếu kết quả; không tạo thêm cloud project hoặc restore thêm một lần chỉ cho P10.
9. Kiểm tra secrets trong phần thay đổi/build client và env target; test script refuse production. Không đóng dev server khác để lấy port.

Không tạo hoặc mở lại `/today` trong QA; source/ảnh/log Today cũ là lịch sử, không là checklist release.
Không thêm Today quota/concurrency/Quick Note/Activity vào gate hoặc chạy harness gộp rồi coi các ca Today là yêu cầu bắt buộc; chỉ chọn ca kiểm tra module đang trong scope.

## User setup

OAuth thật cần consent/user setup P03; account khác nếu có. Thiếu account thứ hai: fixture non-owner vẫn phải đạt, ghi giới hạn OAuth còn chưa thử. Chưa cần thiết lập GitHub Actions, paid runner hay domain riêng.

## Gate và đầu ra

- [x] Lint/build cuối không có lỗi mới do rollout; lỗi baseline có đối chiếu rõ.
- [x] Luồng người dùng hoạt động, owner-only, invariants quan trọng đạt, không saved giả khi DB lỗi.
- [x] P09 recovery evidence còn áp dụng; không bỏ backup acceptance.
- [x] Một evidence ngắn: commands/results, issue mới/còn mở, browser bằng chứng chính và release identity; không hàng chục receipt.
- [x] Có bản app rollback tương thích schema, migrations sẵn cho P11.

## Hoãn / rollback

CI pipeline tự động, browser regression framework toàn diện, performance benchmark và bản screenshot cho mọi state hoãn sau release đầu. Nếu gate fail, sửa đúng phần gây lỗi rồi chạy lại checks bị ảnh hưởng; không lặp toàn suite khi chỉ sửa tài liệu/copy không tác động logic. Không reset production.
