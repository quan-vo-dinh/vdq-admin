# P03 — GitHub login thật, tái sử dụng UI

Bản tinh gọn v2, 2026-10-20. **PASS local**, gồm GitHub cá nhân login/logout/relogin thật; signup đóng sau bootstrap. Xem [evidence P03](evidence/P03.md). Phụ thuộc P02 đã PASS. Tiếp: [P04](phase-04-notes.md). [Nguyên tắc chung](README.md#nguyên-tắc-thực-thi-v2).

## Đầu ra cần đạt

Owner đăng nhập/đăng xuất GitHub trên local app, trang/API được bảo vệ, sẵn sàng nối Notes. Giữ giao diện /auth/auth2/login, màu/layout/components hiện có; không redesign.

## Làm trong phase này

1. Thêm supabase-js và @supabase/ssr tương thích repo. Tạo browser/server clients request-scoped dùng env validator đã có. Không viết lại tooling env hay client factory đa nền tảng.
2. Nối nút GitHub hiện có; bỏ email/password/register/forgot-password khỏi luồng login thật, giữ source template. Bổ sung loading/error/retry và logout theo style sẵn có.
3. Thêm app /auth/callback cho PKCE exchange; provider callback nằm tại Supabase. Chặn external/protocol-relative next redirect; chỉ cho URL nội bộ hợp lệ.
4. Tạo requireOwner() với token đã verify + registry canonical enabled; không tin cookie tồn tại hoặc user_metadata/email/username. Env owner ID cross-check registry, thiếu/mismatch fail closed.
5. proxy.ts refresh cookies/redirect; server page/DAL/API kiểm tra quyền tại nơi đọc/ghi. Layout hiện client thì thêm server boundary tối thiểu phù hợp Next guide cài trong repo; không rewrite toàn shell.
6. API trả 401/403 JSON thật, mutation cookie có Origin/CSRF protection, response riêng tư không shared cache. Fetcher giữ status/code để UI xử lý; logout xóa private SWR cache.
7. Chặn /api/code arbitrary file read; gate/deny API Blog/Developer/social/ticket ngoài scope khi public, giữ UI/mock. Không triển khai các module đó để giải quyết gate.
8. Bootstrap local có kiểm soát: GitHub chính chủ tạo auth.user → xác minh provider GitHub numeric ID → ghi registry qua admin tooling → tắt signups/anonymous/provider thừa/manual linking → logout/login lại. Không first-user-wins/public bootstrap endpoint.
9. Hosted bootstrap sẽ lặp đúng thủ tục ở P11 sau khi áp foundation. Không đòi migrate production trong P03 để chứng minh local auth.

## User setup

U03 tại [USER_SETUP](USER_SETUP.md): OAuth App local riêng, client secret trong cấu hình kín, consent GitHub và xác minh identity. App production có thể tạo sẵn nhưng chưa chặn code local. Nếu chưa có consent/secret, hoàn thành code + local identity tests và ghi đúng blocker OAuth thật, tiếp tục việc độc lập; không báo OAuth đã PASS.

## Kiểm tra bắt buộc và gate

- [x] Owner GitHub login/logout/relogin local; loading/error UI và header đúng. Không cần bộ screenshot cho mỗi trạng thái, chỉ bằng chứng luồng chính.
- [x] Anon/fake JWT/non-owner bị chặn tại API và trang; callback redirect xấu bị chặn; owner disabled không còn data access.
- [x] Cookie refresh và request Origin; không static/shared-cache dữ liệu riêng tư; /api/code đã an toàn.
- [x] Direct Data API thử owner/non-owner/anon bằng fixture; dùng test P02 đã có, chỉ thêm trường hợp wiring auth mới.
- [x] Lint đã chạy: 21 errors/45 warnings cùng baseline; scoped auth mới sạch. Build cuối PASS sau frontend/shared changes; không lặp build nếu không đổi thêm.
- [x] Local non-owner tests PASS; OAuth account khác **chưa thử**. Không dùng tài khoản công ty để cấp quyền app cá nhân.

## Hoãn / rollback

Chưa bearer/mobile adapter, session admin UI, password fallback, MFA tự viết, generic auth framework. Access token có thể còn sống đến expiry sau logout; emergency gate là registry disabled. Nếu OAuth lỗi thì sửa config/giữ fail closed, không mở public API để đi tiếp.
