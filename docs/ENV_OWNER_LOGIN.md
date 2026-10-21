# Đăng nhập owner bằng tài khoản trong env

Đây là bổ sung cho phạm vi GitHub-only trong `PERSONAL_BACKEND_DATABASE_PLAN.md`.
Chỉ có một owner hiện có. GitHub vẫn là phương thức dự phòng; không có đăng ký,
không tạo owner mới và không lưu mật khẩu cá nhân trong Supabase Auth.

## Cấu hình

1. Chạy `node scripts/backend/hash-owner-password.mjs` trong terminal. Mật khẩu
   nhập ẩn, tối thiểu 12 ký tự; script chỉ in hash scrypt với salt ngẫu nhiên.
2. Trong env riêng của đúng môi trường, đặt `OWNER_LOGIN_USERNAME`,
   `OWNER_PASSWORD_HASH`, `OWNER_SESSION_SECRET_KEY`. Giữ nguyên
   `APP_OWNER_USER_ID`, `GITHUB_OWNER_ID` của owner hiện có.
   Hash có dạng `scrypt:salt:digest`, không chứa ký tự `$` dễ bị env loader mở rộng.
3. `OWNER_SESSION_SECRET_KEY` là Supabase secret key (hoặc service-role key của
   stack local), thuộc cùng project với publishable key. Không dùng `NEXT_PUBLIC_`.
   Không dùng key production cho local/preview. Không commit hoặc gửi key/mật khẩu qua chat.
4. Khởi động lại server sau khi thay env. Chưa đủ cấu hình thì form bị vô hiệu hóa,
   API trả 503; không có tài khoản/mật khẩu mặc định.

## Cấu hình local đã đồng bộ

`.env` và `.env.local` chứa cùng cấu hình ứng dụng local, username, hash và key
phát hành session của stack local. `.env.development.local` vẫn có ưu tiên cao
hơn khi chạy dev; giữ URL, publishable key và owner IDs đồng nhất giữa các file.
Không đồng bộ env cloud/tooling vào các file local này.

Mật khẩu local được sinh ngẫu nhiên và lưu trong `.env.owner-login.local`
(file được Git bỏ qua, quyền `0600`, Next không tự nạp file này). File chỉ để chủ
máy lấy thông tin đăng nhập; nên lưu vào password manager rồi xóa file. Runtime
xác thực bằng hash trong `.env`/`.env.local`, không đọc mật khẩu rõ từ file này.

## Cơ chế session và dữ liệu

`POST /api/auth/credentials` kiểm tra Origin, giới hạn body 4 KiB, giới hạn lần thử,
so sánh hash scrypt. Chỉ sau khi mật khẩu đúng, server dùng Auth Admin để tra cứu
đúng UUID owner, kiểm tra email đã xác nhận và GitHub identity đã đăng ký.

Server tạo token đăng nhập một lần cho email của owner rồi tự xác thực token đó,
đặt cookie bằng Supabase SSR và kiểm tra lại `assert_owner`/RLS. Không gửi email,
magic link hoặc token trong JSON về frontend. Mọi CRUD tiếp tục dùng user session,
không dùng admin key. Session được refresh và logout theo cơ chế Supabase hiện có.
Database vẫn cần thiết cho dữ liệu ứng dụng và auth user/session; riêng thông tin
đăng nhập cá nhân chỉ nằm trong env.

Owner phải tồn tại từ trước với email đã xác nhận và GitHub identity đúng. Auth
Admin `generateLink` và `verifyOtp` phải được project cho phép. Cần kiểm chứng trên
môi trường đích; nếu provider/policy chặn thì đăng nhập trả lỗi đóng an toàn.
Không tự bật signup, link identity hoặc thay đổi provider settings để né lỗi.

## Vận hành và giới hạn

- Mỗi process cho phép tối đa 10 lần thử/phút và một lần xác minh đồng thời.
  Deploy nhiều instance cần thêm rate limit chung ở gateway/WAF trước khi mở rộng.
- Thay hash env đổi mật khẩu cho lần đăng nhập tiếp theo; **không thu hồi phiên đã
  cấp**. Khi nghi ngờ lộ mật khẩu, thu hồi session/refresh token trong Supabase Auth.
- Tài khoản/mật khẩu env là bí mật mới; không tái sử dụng mật khẩu GitHub.
- Cấu hình secret key cho Auth issuance mở rộng quyền server; module phát hành
  session nằm riêng tại `lib/auth/owner-session.ts`. Các API dữ liệu không dùng nó.
- P11 vẫn chưa được coi hoàn tất chỉ nhờ build/test. Cần owner smoke test trên
  deployment thật: đăng nhập, reload, CRUD, logout rồi xác nhận API bị từ chối.

## Sửa lỗi khóa cuộn khi chuyển trang

Next Cache Components giữ DOM của route trước trong Activity ẩn. Selector cũ
`:has(.calendar-workspace)` vẫn khớp calendar đã ẩn, làm route mới bị giới hạn
viewport và `overflow: hidden`. Shell hiện đánh dấu layout theo pathname đang hoạt
động; chỉ `/apps/calendar` dùng viewport workspace. Sidebar mobile cũng đóng sau
khi điều hướng để overlay không giữ khóa cuộn.

Tài liệu API chính thức: [generateLink](https://supabase.com/docs/reference/javascript/auth-admin-generatelink), [verifyOtp](https://supabase.com/docs/reference/javascript/auth-verifyotp).
