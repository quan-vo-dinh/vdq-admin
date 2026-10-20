# P00 — Kiểm kê và bảo toàn dữ liệu

Trạng thái: **PASS gate 2026-10-20** — [evidence](evidence/P00.md), user xác nhận toàn bộ data hiện tại trong scope là mock; không import production. Phụ thuộc: không. Phase tiếp: [P01](phase-01-supabase-environments.md). Quy tắc chung: [README](README.md).

## Mục tiêu và đầu vào

Lập inventory đúng với source và dữ liệu còn sống trước khi thêm auth hoặc thay storage. Giữ thay đổi chưa commit, đặc biệt Today và Notes hiện đang được chỉnh sửa. Không restart server để thu thập một bản export từ bộ nhớ vì có thể làm mất chính dữ liệu cần giữ.

## Hiện trạng đã đọc

| Domain | Source | Rủi ro |
| --- | --- | --- |
| Notes | app/api/notes/route.ts, lib/notes/model.ts, app/context/notes-context | Mảng module; ID number; lựa chọn note dựa ID tăng dần |
| Calendar | lib/calendar/store.ts, types.ts, validation.ts | .data/calendar.json; giờ local chưa có offset; seed tự sinh khi file không có |
| Today | lib/today/{store,model,agenda,activity}.ts, app/components/today | .data/today.json; Quick Note gọi Notes; Agenda gọi Calendar; activity tính từ assigned date |
| Finance | lib/finance/{model,csv,demo}.ts, finance-context | Demo + state; money number; CSV có heuristic duplicate; ảnh goal data URL |
| Learning | lib/learning/{model,types,demo}.ts, learning-context | State; route /apps/tickets render LearningApp, không phải ticket backend |
| Profile | lib/profile.ts, app/components/user-profile/index.tsx | Save personal/address chỉ đổi state; social template là scope khác |

## Công việc cụ thể

1. Ghi git branch/status/diff phạm vi trước thay đổi; inventory route/pages/API và module caller, không reset hay commit thay user.
2. Thu thập baseline lint/build và test module trên workspace hiện tại khi thực thi; ghi commit/worktree state, port/dev server, lỗi có trước. Không tắt server/tab đang có nếu chưa export Notes/state.
3. Phân loại mỗi dataset: dữ liệu thật cần giữ, seed demo, local preference, dẫn xuất (KPI/streak/balance), state đã mất. Không hứa khôi phục state không còn tồn tại.
4. Export Calendar/Today bằng copy snapshot nhất quán; nếu server đang ghi, snapshot qua read API hoặc freeze writes ngắn. Export Notes qua API đang sống; không sửa route chỉ để dump secret.
5. Nếu Finance/Learning/Profile có thay đổi thật trong tab còn mở, tạo export có kiểm soát từ UI/context; nếu không có thì production khởi tạo rỗng. Dữ liệu demo chỉ dùng fixture local.
6. Manifest import: source, timestamp timezone, record counts, checksum, schema version, trường cần map, ID nguồn và destination mapping. Xác minh bản export parse được; lưu dữ liệu ngoài Git có mã hóa.
7. Rà tất cả consumer không chỉ trang chính: Today Quick Note/Agenda/Overview, header profile, finance widgets/reports, CSV download, learning history.
8. Rà /api/code và endpoint ngoài scope; lập kế hoạch deny/gate production. /api/ticket template không là nguồn Learning; /api/userprofile social không là personal profile.
9. Lập inventory thao tác UI: tạo/sửa/xóa/undo/move/import/save/allocate goal/ảnh, endpoint đích và test cần đổi. Chốt default không seed demo vào tài khoản thật.

## File đầu ra dự kiến khi thực thi

- Evidence P00 có route/action/data inventory và baseline test; không chứa dữ liệu nhạy cảm.
- Script export/import preflight dự kiến trong scripts/data/ và cấu hình thư mục backup ignore; không đưa snapshot thật vào docs.
- Map riêng Notes numeric ID → UUID, account/category codes → UUID; Today/Calendar UUID hợp lệ giữ nguyên.

## User setup

U00 trong [USER_SETUP](USER_SETUP.md): giữ tab dữ liệu, đánh dấu dữ liệu thật, container runtime và nơi lưu export. Nếu chưa có runtime, vẫn làm inventory; P01 local integration chờ runtime/dev project.

## Kiểm thử và gate

- [x] Counts/checksum trước và sau export khớp; có mẫu rich text, event all-day và transfer nếu là dữ liệu thật.
- [x] Source export không bị xóa; không seed ghi đè file hoặc khởi tạo production.
- [x] Bảng route/action inventory chỉ ra đầy đủ caller hiện có; Blog/Developer/social nằm ngoài scope.
- [x] Baseline test phân biệt lỗi cũ với lỗi sẽ do migration; không báo PASS từ plan này.
- [x] User action cần thiết được ghi; không thu thập secret qua chat.

## Rollback và bàn giao

P00 không đổi runtime. Khôi phục bằng bản sao file nếu chính công cụ export làm thay đổi dữ liệu ngoài ý muốn; không restore toàn workspace. Bàn giao manifest/import decisions sang P02/P04–P08; snapshot trước cutover production sẽ được lấy lại trong P11 để không bỏ sót dữ liệu phát sinh.
