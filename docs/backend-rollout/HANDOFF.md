# Bàn giao P06/P07 — 2026-10-20

**P06 triển khai xong, còn gate CSV browser do quyền upload extension. P07 PASS local.**
Chi tiết: [P06](evidence/P06.md), [P07](evidence/P07.md), [user setup](USER_SETUP.md).
Không có cloud migration/deploy, commit/push hoặc reset DB. P08–P12 chưa triển khai.

## Bắt đầu phiên sau

1. Đọc README → evidence P06/P07 → USER_SETUP U06/U07.
2. Nếu user đã bật Chrome → `chrome://extensions` → ChatGPT → Details → **Allow access to file URLs**,
   hoàn tất browser CSV: tài khoản QA, CSV quoted/CRLF/BOM có hai dòng giống nhau, preview cảnh báo
   nhưng import cả hai → reload → overview/transactions phản ánh DB. Một dòng invalid phải chặn import.
   API/SQL đã chứng minh atomicity, batch retry/hash và bound 1.000 dòng, không cần lặp toàn bộ.
3. Cập nhật evidence/gate P06 sau khi browser pass. Khi đó tiếp **P08 Profile/Preferences/private goal images**.
   Không tự mở rộng sang backup/deploy/mobile khi user chưa giao phase tương ứng.
4. Không reset/bootstrap owner, bật signup lại, chạy cloud push hoặc làm lại P00–P05.

## Hiện trạng implementation

- P00–P05 PASS local theo evidence cũ. Notes/Calendar DB giữ nguyên; `/` vẫn chuyển `/developer`.
- Finance `/api/finance` overview và resource APIs accounts/categories/transactions/budgets/budget_months/
  goals/bills/settings/import dùng owner + user JWT. Context async actions thay update(transform), CAS
  update/delete, stable create UUID, full history pagination cho báo cáo, numeric text DTO/safe UI adapter.
  Account opening/edit/archive, planned bills và startsOn dùng dialog ở header Finance. Metadata categories
  được tạo idempotent; accounts/transactions/goals/bills bắt đầu rỗng. Category archive giữ report history.
- CSV 1.000 rows / 1.000.000 bytes, amount <=1 tỷ, description <=150; server reparse và RPC atomic,
  batch hash/retry, không dedupe các giao dịch giống nhau. Goal image control chờ P08, không base64 DB.
- Learning vẫn `/apps/tickets`; habits/checkins RLS, composite FK, unique owner+habit+VN day.
  Check-in RPC only; khóa habit trước check-in để serialize với archive. Revision/date guard chống stale
  update/undo và editor qua 00:00 VN. Full history cho streaks; SWR focus/date refresh, draft khi lỗi,
  celebration sau commit; loading/error không hiện demo streak.
- Local migrations mới: `20261020000600_finance.sql`, `20261020000700_learning.sql`,
  `20261020000710_finance_category_invariants.sql`; đã áp local, types/database.ts sinh từ DB thật.
  P08 cần bỏ `finance_goals_image_path_check` hiện chỉ cho NULL khi nối private Storage thực sự.

## Kiểm chứng

- Finance **13/13**, Learning **3/3** unit PASS. Domain SQL mới **31/31** PASS, gồm owner/non-owner,
  disabled owner, cross-owner FK, direct-write deny và archive/history/category guards.
- Production API :3100: CRUD/CAS/invalid money/date/kind, transfer/refund, CSV atomic/retry/two identical
  rows, batch 1.000 rows, báo cáo >1.000 rows, budgets theo tháng, goal/bills non-transfer, Learning
  archive/checkin/undo/revision/date; anonymous denial. Xem log trong evidence.
- Real browser :3000: Finance account/transaction/budget/goal; Learning create/check-in/reload/history,
  conflict giữ draft, edit/archive/reload/resume/undo và tab khác thấy data. CSV filechooser bị extension chặn;
  user đã chọn “Tôi sẽ bật rồi báo lại”, chưa khẳng định quyền đã được bật.
- Build PASS; scoped lint sạch. Full lint baseline **21 errors/45 warnings** ngoài scope. Client JS scan sạch.
- Production process stop/start giữ cùng Finance records và Learning 25-minute session; lần browser undo
  sau đó là thao tác QA có chủ đích. Không coi lịch sử screenshot là current DB sau cleanup.

## Bảo toàn / runtime

Original Next :3000 + Supabase local được giữ. Không đóng tab/service đang dùng của user.
Có thay đổi đồng thời ngoài scope từ user/phiên khác ở `components/ui/dialog.tsx`, docs/dialog-sizing.md,
Notes/Calendar/Blog/Developer/Profile, style-lyra và các `size` props (gồm Learning/Finance).
Đã giữ các thay đổi này khi chỉnh cùng file; không reset/reformat/commit chúng.

Owner GitHub `quan-vo-dinh`, numeric ID `129001260`, Auth UUID
`a08fa6e9-f3b8-4a8f-a62d-f192012051be`; signup/email/SMS/anonymous/manual linking OFF, GitHub ON.
Env ignored giữ nguyên. Node 22.23.2/pnpm 11.22.0/Supabase CLI 2.121.0. Tooling explicit `--local`.
`local-domain-session.mjs` tái sử dụng session owner local đã login để sign JWT test trong memory;
không in token, sửa registry hoặc lấy browser cookies. Không dùng trên cloud.

U09 backup location/recovery key và U11 hosted OAuth/Vercel/env/domain vẫn thuộc các phase sau.
P06/P07 không cần bạn cấp secret/account mới; quyền file URL chỉ cần để tự động kiểm chứng CSV browser.

## Phạm vi Today đã đính chính — tiếp tục giữ

**User xác nhận không có trang Today.** `/today` và sidebar đã xóa; không phục hồi hoặc chuyển
Quick Note/priorities/Activity sang trang khác. Source/API/schema local còn lại chỉ là lịch sử.
Trước P11 cần rà/tách phần Today trong migrations local gộp `20261020000400_notes_today_calendar.sql`
và `20261020000500_today_revision_guard.sql`; không đẩy nguyên xi lên cloud. P09/P10/P12 không lấy
Today làm scope backup, release QA hoặc mobile. [Đính chính](evidence/P05-today-removal.md).

QA cleanup: removed only captured browser fixture UUIDs (own transaction/goal/budget/month/habit/check-ins). Retained account 5d2e4540-f2b4-4209-809e-ae57b3465f02 (QA browser wallet), because another CSV transaction outside this run's fixture IDs now references it. Preserved that transaction and its import batch. Metadata/settings and all other records untouched. API fixtures already cleaned in finally.

End-of-session runtime: test production :3100 stopped; original Next :3000 and Supabase local left running. No commit/push/cloud deployment.
