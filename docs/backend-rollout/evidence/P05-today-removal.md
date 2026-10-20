# Đính chính và xóa trang Today — 2026-10-20

Theo user: **không có trang Today**, xóa trang và sửa các plan hiểu nhầm.

- Xóa `app/(dashboard-layout)/today/page.tsx` và đúng entry Today trong sidebar.
  Root `/` giữ redirect `/developer`; Notes/Calendar và thay đổi khác giữ nguyên.
- Sửa README, plan tổng thể, P02/P04/P05/P10/P11, USER_SETUP và HANDOFF:
  P04 chỉ Notes, P05 chỉ Calendar/settings; không yêu cầu trang Today/Quick Note/priorities/Activity,
  không chuyển các widget đó sang trang khác hoặc tự khôi phục UI.
- P04/P05 evidence trước có đính chính nổi bật: các kết quả/ảnh Today là lịch sử của hiểu nhầm,
  không phải tính năng được user chấp nhận. P00/P01 và các log/ảnh lịch sử không bị viết lại/xóa.
- Giữ source/API/schema Today local có từ trước, không drop dữ liệu hay sửa migration đã áp.
  Plan P11 bắt buộc rà/tách phần Today khỏi migration cloud trước deploy; không tự triển khai
  bảng/RPC Today lên production chỉ vì chúng nằm trong local migration gộp.

Kiểm chứng sau thay đổi:

- `pnpm build`: **PASS**, không còn page `/today` trong build routes;
  `/api/today` còn lại là backend local historical đã ghi rõ. [Build](P05-today-removal-build.log).
- `pnpm lint`: baseline **21 errors/45 warnings**, không tăng. [Lint](P05-today-removal-lint.log).
  Scoped eslint sidebar PASS; `git diff --check` PASS.
- HTTP authenticated existing local owner: **`/today` 404**, Notes/Calendar 200 và rendered sidebar
  không còn href `/today`; `/` vẫn redirect `/developer`. [HTTP](P05-today-removal-http.log).
  Kiểm tra ban đầu kỳ vọng HTTP 307 ở `/` không khớp do Next streamed redirect trả 200;
  đã xác minh cả `NEXT_REDIRECT` và meta refresh `/developer` trong body, không sửa root code.

Không thay env/owner/DB data; không reset, cloud mutation, commit/push/deploy; không cần user setup mới.
Original dev :3000 và Supabase giữ nguyên. Phiên sau tiếp P06 theo scope đã đính chính.

## Rà lại các phase phía sau theo yêu cầu user

- Đã đọc P06–P12. P06 Finance, P07 Learning, P08 Profile/Preferences/Storage không có đầu việc Today; giữ nguyên.
  Finance overview/goal priority và Learning check-in hôm nay là tính năng của module tương ứng, không phải trang Today.
- P09 chốt rõ tập dữ liệu backup/restore theo scope đã chấp nhận, không yêu cầu phục hồi Today.
- P10 loại Today UI/quota/Quick Note/Activity khỏi QA/gate, kể cả ca còn nằm trong harness lịch sử gộp.
- P11 không publish Today page/API/schema/provider/widget; không bootstrap/smoke/backup/bàn giao Today.
  Rà/tách migration trước cloud chỉ nhằm loại phần dư, không phải xây lại tính năng.
- P12 không đưa Today trở lại qua start URL/deep link/navigation/PWA/APK hoặc sync.
- README, plan tổng thể và HANDOFF đã đồng bộ. Chỉ sửa tài liệu; `git diff --check` PASS,
  không thay source/DB/runtime hoặc chạy lại build/tests đã đạt chỉ vì sửa scope prose.
