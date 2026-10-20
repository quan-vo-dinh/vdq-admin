# Bàn giao sau đính chính Today — 2026-10-20

**User xác nhận không có trang Today.** Đã xóa route `/today` và mục sidebar.
Không tự tạo lại trang này, không chuyển widget Today/Quick Note/priorities/Activity sang trang khác.
P04 hiện là **Notes**, P05 là **Calendar/settings**; backend hai module đã PASS local.
Đã rà P06–P12: không giao thêm Today backend/UI/quota tests/backup/restore/sync/mobile hoặc production smoke.
P09 chỉ backup module được chấp nhận; P10 không lấy test Today từ harness gộp làm gate;
P11 không publish Today API/schema/UI; P12 không dùng Today làm start URL/deep link.
Tiếp theo P06 Finance. [Đính chính/xóa trang](evidence/P05-today-removal.md),
[P04 lịch sử](evidence/P04.md), [P05 lịch sử](evidence/P05.md).

## Bắt đầu phiên sau

1. Đọc README → P06 và USER_SETUP liên quan. Không lặp P00/P01 hoặc bootstrap P03.
2. Các trang dùng được: `/apps/notes`, `/apps/calendar`; `/` vẫn redirect `/developer`.
3. Today source/API/bảng/RPC local từ diễn giải trước được giữ để không xóa dữ liệu hay viết lại migration đã áp.
   Chúng **không thuộc scope active/production**, không phải công việc còn thiếu phải phục hồi.
4. Trước P11 cần rà/tách phần Today trong migration local gộp
   `20261020000400_notes_today_calendar.sql` và `20261020000500_today_revision_guard.sql`.
   Không đẩy nguyên xi schema Today lên cloud vì thấy nó đã có ở local. Cloud chưa áp business migrations.
5. Giữ mọi thay đổi ngoài phạm vi; không reset/reformat/commit/push/deploy nếu chưa được giao.

## Hiện trạng đã kiểm chứng

- P00/P01 historical evidence giữ nguyên. P02 owner registry/RLS, P03 GitHub thật PASS local.
- Notes UUID + stable create retry/201/canonical item; atomic revision CAS/404/409; draft giữ khi lỗi;
  sanitizer trước Tiptap kể cả JSON direct Data API. Calendar timed UTC/explicit +07 adapter,
  all-day DATE exclusive end, overlap query, persistent settings CAS. User JWT + DAL owner checks.
- Trước đính chính: SQL 65/65 (có cả Today historical), Notes unit 4/4, Calendar 14/14,
  Notes HTTP PASS, domain integration 8/8 nhóm (có Today historical), build PASS, scoped lint sạch.
  Full lint baseline 21 errors/45 warnings. 99 compiled JS assets không thấy secret ở lần scan đó.
- Browser Notes create/edit/reload/conflict draft, Calendar desktop/mobile create/all-day/settings/ICS;
  app production :3100 stop/start giữ record. Native Calendar pointer drag chưa xác minh thành công;
  move utility/end-time adapter có unit/API evidence. UI không có resize handle.
- Những kết quả Today/Quick Note/Activity/ảnh cũ chỉ là lịch sử, không chứng minh user chấp nhận trang đó.
  Kiểm chứng sau xóa trang ghi trong evidence đính chính; không dùng build cũ làm bằng chứng route đã xóa.
- Các record QA của phiên P04/P05 trước đã dọn; owner thật/settings giữ nguyên. Lượt này không xóa DB data.

## Runtime và cấu hình

Original Next :3000 và Supabase local giữ nguyên; không chiếm/đóng service của user.
Nếu cần khởi động lại: `pnpm backend:local:start` nạp ignored `.env.supabase.local`,
`pnpm dev` chỉ khi không có server. Không reset DB hoặc bật signup lại.
Node 22.23.2/pnpm 11.22.0/Supabase CLI 2.121.0, env hiện có giữ nguyên.

Owner GitHub `quan-vo-dinh`, numeric ID `129001260`, Auth UUID
`a08fa6e9-f3b8-4a8f-a62d-f192012051be`; signup/email/SMS/anonymous/manual linking OFF, GitHub ON.
Không dùng credentials công ty. Không chạy harness auth pre-bootstrap trên registry thật.
`local-domain-session.mjs` dùng test JWT local in-memory của existing owner session, không in token,
không chỉnh registry/user hoặc đọc browser cookie; chỉ chạy local khi có owner đã login.

P04/P05 không cần user setup mới. U09 backup/recovery và U11 cloud OAuth/Vercel/env/domain vẫn chưa xong.
Mọi CLI DB thao tác explicit `--local`, không db push/reset/config push cloud trong scope hiện tại.
Đích production vẫn Vercel Hobby + Supabase cloud, không phải chỉ local.

## Hợp đồng/kiểm thử phase tiếp

- DAL requireOwner bằng user JWT; không admin runtime key. Revision do DB tăng, ID+owner+expectedRevision
  atomic trong mutation app, 409 giữ draft; không hứa CAS cho owner direct Data API.
- Dùng domain server + route adapters nhỏ, không thêm ledger/ORM/framework.
- Chạy module tests đúng scope thay đổi (Notes/Calendar/Finance/Learning), RLS suite liên quan,
  lint/build và browser luồng thực tế. Không coi Today UI/quota test là gate release mới.
- P10 QA: login → Notes → Calendar → Finance → Learning → Profile/Preferences → logout.
- P11 rà migration scope đã đính chính trước cloud push; backup/restore theo P09, production smoke theo P11.
