# P04 — Notes lưu thật từ UI đến database

Bản tinh gọn v2, 2026-10-20. **PASS local** ngày 2026-10-20; evidence: [P04](evidence/P04.md). Phụ thuộc P03. Tiếp: [P05](phase-05-today-calendar.md). [Nguyên tắc chung](README.md#nguyên-tắc-thực-thi-v2).

## Đầu ra cần đạt

Mốc đầu tiên dùng được: GitHub login → tạo/sửa/xóa Notes → reload/restart vẫn còn. Production bắt đầu rỗng theo quyết định user, không import note demo.

## Schema và cách triển khai

1. Migration notes: id UUID, owner_id, title 1..200, content JSONB, color allowlist, note_at timestamptz, created_at/updated_at, revision integer tăng do DB; index owner_id+note_at+id.
2. Explicit grants/RLS owner-only. CRUD một bảng qua supabase-js; update/delete filter ID+owner+expectedRevision trong một query, kiểm tra affected rows để trả 404/409 đúng. Không tạo RPC cho mọi thao tác.
3. Tái sử dụng validator lib/notes/model.ts ở server; DB CHECK shape cơ bản/kích thước cần thiết. Không viết lại toàn bộ validator Tiptap bằng SQL hoặc giữ hai bộ JS/SQL parity.
4. Dữ liệu DB vẫn coi là untrusted lúc render, kể cả owner tự ghi qua Data API: chỉ render document/marks/links trong whitelist, không raw HTML. Không tuyên bố Next validator chặn mọi direct write của owner; RLS chặn người ngoài, renderer phải an toàn.
5. Không cần plain_text lưu trùng lúc đầu: dẫn xuất từ content bằng helper đang có. Giữ nút Save, không tự thêm autosave/trash/history/upload.
6. Giữ /api/notes base path và data envelope cho caller; POST trả created item rõ + status 201. Tạo UUID một lần cho ý định create, retry dùng cùng ID để tránh duplicate; conflict đọc lại canonical item, không dựng ledger request chung.
7. Đổi NotesType/context/editor/add form/selection/sort từ number sang UUID; bỏ giả định max ID mới nhất. selectedNoteId dùng string|null. Chỉ nối các caller Notes thực sự có trong UI được user chấp nhận; không tạo trang Today/Quick Note.
8. Save chỉ clear form hoặc báo thành công sau commit, giữ draft khi lỗi/409. Không silent overwrite; không retry mutation vô hạn/queue offline.
9. Có thể giữ list đầy đủ cho tập dữ liệu nhỏ hiện tại; dùng projection không tải rich content thừa nếu dễ. Chỉ thêm cursor pagination khi có nhu cầu dung lượng thực, không bắt buộc trước Notes MVP.
10. Chỉ một module server notes và route adapters cần thiết; không bắt buộc tách service/repository/schema thành nhiều file rỗng.

## User setup

Không có setup mới ngoài GitHub P03. Không cần mapping/import numeric ID cũ vì toàn bộ dữ liệu hiện tại đã xác nhận mock; đổi caller/types đầy đủ nhưng giữ mock của module ngoài scope.

## Kiểm tra bắt buộc và gate

- [x] Owner create/edit/delete, UUID selection đúng.
- [x] Reload + restart app giữ dữ liệu; mở tab khác thấy thay đổi sau refresh.
- [x] Rich text/date Việt Nam giữ đúng, link/JSON lỗi và payload quá lớn bị xử lý an toàn; không cần tái tạo validator SQL.
- [x] Hai edit cùng revision: một thắng, một 409; retry create không nhân đôi; form giữ nội dung khi save fail.
- [x] Anon/non-owner không đọc/ghi được; thêm policy test notes vào suite hiện có, không dựng auth harness khác.
- [x] Cập nhật test-notes/test-notes-api cho UUID/status/revision, chạy kiểm tra module + lint/build cuối nếu đổi UI. Browser luồng chính desktop/mobile.

## Hoãn / rollback

Hoãn cursor nâng cao, audit history, toàn bộ content search engine, SQL document validator và request ledger. Không seed-on-read hoặc fallback memory khi DB lỗi. Nếu lỗi code thì rollback bản tương thích DB/khóa mutation tạm, không trả production về dữ liệu demo.
