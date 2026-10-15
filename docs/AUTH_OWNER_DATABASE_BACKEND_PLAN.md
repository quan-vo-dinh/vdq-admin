# Kế hoạch xác thực GitHub hoặc tài khoản nội bộ, phân quyền và backend dữ liệu

Ngày lập: 2026-10-15. Phạm vi: trạng thái hiện có của repository; đây là kế hoạch, chưa triển khai OAuth hoặc database.

## 1. Mục tiêu và quyết định đề xuất

- Chỉ chủ dự án được vào dashboard và gọi API dữ liệu, qua **một trong hai cách**: GitHub `quan-vo-dinh` hoặc tài khoản nội bộ username/password. Cả hai ánh xạ về cùng một `OWNER` và cùng dữ liệu; không mở tự đăng ký, Google login hoặc vai trò khác.
- Dùng **Auth.js (NextAuth cho App Router)** với GitHub provider và Credentials provider. Giữ session JWT ở cả giai đoạn đầu lẫn sau khi thêm PostgreSQL, vì Credentials provider của Auth.js yêu cầu JWT session; database lưu dữ liệu ứng dụng, không lưu mật khẩu nội bộ.
- Nhánh GitHub khóa quyền theo **GitHub user ID**, không theo username/email. GitHub API công khai trả `login=quan-vo-dinh`, `id=129001260` tại ngày lập kế hoạch. Khi cấu hình thật, đối chiếu lại ID này với profile nhận từ OAuth và đặt `GITHUB_OWNER_ID` ở môi trường server.
- Nhánh nội bộ lấy username từ `OWNER_LOGIN_USERNAME`, **hash Argon2id có salt** từ `OWNER_PASSWORD_HASH` trong env server/secret manager; không lưu mật khẩu rõ trong env, source, DB hoặc log. Thiếu/sai cấu hình thì nhánh đăng nhập tương ứng bị từ chối (fail closed). Không có trang đăng ký hoặc reset password công khai; đổi mật khẩu bằng cách tạo hash mới và cập nhật secret môi trường.
- Giữ backend trong **Next.js Route Handlers** của ứng dụng hiện tại. Thêm lớp service/repository phía server thay cho mảng dữ liệu trong Route Handler; chưa có lý do tạo một service NestJS/Express riêng.
- Dùng **PostgreSQL + Prisma ORM/Migrate** cho dữ liệu có cấu trúc, **Zod** để kiểm tra input ở biên API, giữ **SWR** ở client. Dùng object storage chỉ khi tính năng tải ảnh/file thật được triển khai; database lưu metadata/URL, không lưu ảnh nhị phân.

### Vì sao chọn stack này

| Phần | Chọn | Lý do và giới hạn |
| --- | --- | --- |
| Xác thực | Auth.js + GitHub/Credentials providers | Tích hợp App Router và hai cách đăng nhập trong một cấu hình; `authorize` tự xác minh mật khẩu nội bộ. Tài liệu Auth.js hiện hướng dẫn `next-auth@beta`; khi triển khai phải chốt phiên bản tương thích Next 16 và kiểm thử cả hai luồng trước production. |
| Session | JWT, cookie do thư viện quản lý | Credentials provider yêu cầu JWT. Phiên đã cấp không thu hồi riêng lẻ ngay được; đặt thời hạn phù hợp, kiểm tra owner ở mỗi yêu cầu, xoay `AUTH_SECRET` để vô hiệu hóa toàn bộ phiên khi cần. Đổi hash mật khẩu không tự vô hiệu hóa JWT cũ. |
| Database | PostgreSQL | Phù hợp quan hệ bài viết/bình luận, chủ sở hữu/ghi chú/ticket; có giao dịch và ràng buộc dữ liệu. Chọn nhà cung cấp managed PostgreSQL khi biết nơi deploy, tránh ràng buộc schema với một vendor. |
| ORM | Prisma | Schema, type và migrations rõ ràng. Không cần Auth.js database adapter cho hai phương thức đăng nhập này; Drizzle là phương án thay thế nếu muốn kiểm soát SQL trực tiếp hơn. |
| Backend | Next.js Route Handlers + server-only service/repository | Tận dụng kiến trúc hiện có, giữ handler mỏng và tập trung kiểm tra quyền/dữ liệu. |

**Phương án đã cân nhắc:** Better Auth phù hợp nếu dựng database ngay cùng giai đoạn xác thực; cấu hình thông thường dùng database, dù tài liệu cũng mô tả chế độ stateless. Chọn Auth.js cho bước khóa truy cập độc lập với DB; nếu phiên bản Auth.js tương thích Next 16 không đạt kiểm thử cả GitHub và Credentials, đổi quyết định trước khi triển khai thay vì ghép hai thư viện auth. Drizzle phù hợp khi nhóm muốn kiểm soát SQL sát hơn; PostgreSQL vẫn giữ nguyên nếu đổi ORM.

## 2. Hiện trạng đã kiểm tra

| Nguồn | Trạng thái và hệ quả |
| --- | --- |
| `app/auth/auth2/login/page.tsx`, `app/auth/authforms/social-buttons.tsx` | Form email/password và nút GitHub hiện chỉ là giao diện, chưa xác minh tài khoản nội bộ hoặc thực hiện OAuth. Các trang register/forgot-password/two-steps cũng là template. |
| `app/api/notes/route.ts`, `app/api/ticket/route.ts` | Có GET/POST/PUT/DELETE tùy tính năng nhưng dữ liệu nằm trong mảng module; GET có nhánh reset dữ liệu. Chưa lưu bền. |
| `app/api/blog/route.ts`, `app/context/blog-context/index.tsx` | Bài viết được tạo từ dữ liệu mẫu; API POST chỉ thêm bình luận vào mảng. Trang tạo/sửa bài chưa lưu bài viết; bình luận ở trang chi tiết cập nhật state client. Context còn gọi `/api/blog/[id]` dù không có Route Handler tương ứng. |
| `app/api/userprofile/userdata.ts`, các route `app/api/userprofile/**` | Posts, users, gallery là dữ liệu mẫu trong source; like/comment/reply sửa mảng trong bộ nhớ. Không nên coi các persona mẫu này là tài khoản đăng nhập thật. |
| `lib/profile.ts`, `app/components/user-profile/index.tsx` | Hồ sơ cá nhân hiện hardcode; nút Save chỉ đổi React state, mất khi tải lại. |
| `app/components/dashboards/modern/**`, `app/components/tables/{data,table-data}.ts` | Nhiều KPI/chart/order/employee là dữ liệu trình diễn hardcode, không phải số liệu nghiệp vụ đã có nguồn. |
| `app/context/language-context.tsx` | Ngôn ngữ được lưu localStorage; đây là tùy chọn phía trình duyệt, có thể đồng bộ DB nếu muốn dùng nhiều thiết bị. |
| `app/api/code/route.ts` | **Rủi ro phải xử lý trước khi public:** endpoint nhận `file` từ query rồi đọc file dưới `process.cwd()` mà không có xác thực hoặc allowlist; có thể bị lợi dụng để đọc cả file `.env.local` chứa thông tin xác thực nếu file tồn tại trên server. |
| `next.config.ts`, `Dockerfile` | Next cấu hình `output: "standalone"`; Dockerfile hiện build kiểu Vite `dist` rồi chạy Nginx và dùng npm, không phù hợp runtime Route Handlers/lockfile pnpm. |

## 3. Thiết kế quyền và ranh giới bảo vệ

1. Tạo GitHub OAuth App cho môi trường local và production với callback `/api/auth/callback/github`, giữ client secret ở server. Khai báo `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, `GITHUB_OWNER_ID`, `OWNER_LOGIN_USERNAME`, `OWNER_PASSWORD_HASH`; không đặt trong `NEXT_PUBLIC_*` hoặc commit vào Git. Dùng `.env.local` được ignore ở máy local, secret manager/env kín ở production. Giữ quyền OAuth tối thiểu cần cho profile, không xin quyền repo.
2. Trong Auth.js `signIn` callback, nhánh GitHub chỉ cho qua khi `account.provider === "github"` và `account.providerAccountId === GITHUB_OWNER_ID`. Nhánh Credentials dùng `authorize` để kiểm tra input, so username với env và xác minh password với hash Argon2id; callback chỉ chấp nhận user nội bộ đã được `authorize` trả về. Sai thông tin chỉ trả lỗi chung, không tiết lộ trường nào sai. Giới hạn tốc độ và số lần thử đăng nhập bằng cơ chế dùng chung giữa các instance khi deploy nhiều instance.
3. Sau khi một trong hai nhánh thành công, callback chỉ gắn một `ownerId` nội bộ ổn định và vai trò `OWNER` vào JWT/session. `requireOwner()` phải xác minh claim này từ session do server kiểm tra; không tin ID, role, tên hoặc email gửi từ client. Không coi tài khoản GitHub và tài khoản nội bộ là hai chủ sở hữu dữ liệu khác nhau.
4. Tạo trang đăng nhập có nút GitHub và form username/password nội bộ, trạng thái lỗi chung và nút đăng xuất. Bỏ liên kết Register/Forgot Password/Two Steps trong điều hướng; các đường dẫn cũ chuyển hướng hoặc trả 404. Form hiện tại phải được nối vào Credentials provider thật.
5. `proxy.ts` của Next 16 chuyển người chưa đăng nhập khỏi các trang dashboard. Đồng thời gọi `requireOwner()` tại **mọi** Route Handler đọc/ghi, Server Action và truy vấn dữ liệu. Proxy chỉ là lớp chặn sớm; API trả HTTP 401/403 thật khi không đủ quyền. Giữ public đúng các route cần cho đăng nhập/OAuth, trang login/error và static asset công khai.
6. Loại bỏ `/api/code` nếu chỉ phục vụ demo. Nếu cần giữ, giới hạn danh sách file được đọc và thêm kiểm tra owner; không nhận đường dẫn tùy ý. Không triển khai công khai trước khi xử lý endpoint này.
7. Không cache dữ liệu riêng tư bằng `use cache` hoặc response public; kiểm tra quyền gần nguồn dữ liệu. Ảnh trong `public/` vẫn truy cập trực tiếp được, nên nội dung media riêng tư về sau phải dùng nơi lưu private và URL có thời hạn.

Các biến môi trường cần có (giá trị minh họa, không phải secret thật):

```dotenv
AUTH_SECRET=<secret-ngau-nhien>
AUTH_GITHUB_ID=<github-oauth-client-id>
AUTH_GITHUB_SECRET=<github-oauth-client-secret>
GITHUB_OWNER_ID=129001260
OWNER_LOGIN_USERNAME=<username-noi-bo>
OWNER_PASSWORD_HASH=<argon2id-encoded-hash>
```

## 4. Thiết kế database cho thông tin hiện tại

Nguyên tắc: schema phản ánh dữ liệu đang có, giữ các nội dung mẫu qua seed có phiên bản; không tạo mô hình nghiệp vụ tương lai từ nhãn của widget demo. Dùng ID ổn định, khóa ngoại, thời gian chuẩn UTC, `createdAt/updatedAt`, index cho truy vấn danh sách, unique constraint ở cấp DB. Seed có thể chạy lại mà không nhân bản bản ghi; lưu mapping ID cũ khi chuyển dữ liệu.

| Nhóm | Bảng/model đề xuất | Nội dung hiện có cần giữ |
| --- | --- | --- |
| Chủ sở hữu | `Owner`, `OwnerProfile`, `UserPreference` | Một owner ID ổn định cho cả GitHub và Credentials; quyền `OWNER`; tên/biệt danh/bio/ảnh/web/social/workplace/education, thông tin cá nhân/địa chỉ đang sửa ở UI, ngôn ngữ/theme nếu cần đồng bộ thiết bị. `Owner` tách khỏi các persona mẫu; username và hash của tài khoản nội bộ chỉ ở env. Không cần bảng `Account`/`Session` của Auth.js khi dùng JWT và không bật adapter. |
| Notes | `Note` | title, color, trạng thái xóa, ngày tạo/sửa, `ownerId`. Bỏ hành vi reset dữ liệu khi refresh. |
| Tickets | `Ticket` | title, description, status, label, tên/avatar người phụ trách trong dữ liệu mẫu, ngày tạo/sửa/xóa, `ownerId`. Chưa tạo hệ thống nhân viên thật chỉ vì mẫu có tên agent. |
| Blog | `BlogPost`, `BlogComment` | title, slug unique, nội dung, category, ảnh bìa, trạng thái xuất bản/lịch, featured, view/share, tác giả hiển thị, comment/reply qua `parentId`. Gắn `ownerId` riêng với tên tác giả mẫu. Chốt định dạng nội dung Tiptap (JSON hoặc HTML đã làm sạch) trước migration. |
| Social/profile demo | `SocialPost`, `SocialComment`, `SocialMedia`, `SocialProfile`, `GalleryItem` | Nội dung, ảnh/video URL, likes và reply, danh sách user/gallery/follow mẫu. Giữ display profile độc lập với GitHub `User`; kiểm tra các route nào thật sự còn dùng trước khi chuyển. |
| Dashboard/bảng demo | `DemoDataset` với `key`, `version`, `payload` JSONB, `updatedAt` | Snapshot cho KPI, chart, orders/projects, employee/performer rows đang hardcode. Cách này lưu đủ dữ liệu hiện tại mà không giả định các KPI là nghiệp vụ thật. Khi có yêu cầu sản phẩm thực tế, thiết kế bảng chuẩn riêng và bỏ snapshot tương ứng. |
| Media hiện tại | Đường dẫn trong các record/metadata | Giữ file ảnh mẫu trong `public/`; DB lưu path/URL. Nếu có upload thật, bổ sung `MediaAsset` + object storage trong một nhánh công việc riêng. |

Trước khi tạo migration đầu tiên, lập danh sách từng dataset nguồn, phân loại **nội dung cần dùng thật / nội dung trình diễn** và chụp số lượng bản ghi, trường dữ liệu, quan hệ. Với dashboard demo, chuyển các mảng sang `DemoDataset` và đọc qua API chỉ nếu yêu cầu "mọi dữ liệu hiện tại ở DB" vẫn áp dụng; giá trị KPI không được trình bày là số liệu hoạt động thật.

### Ranh giới backend dự kiến

- `app/api/**/route.ts`: xác thực, kiểm tra input, gọi service, trả HTTP status/DTO; không chứa mảng mutable hoặc truy vấn SQL rải rác.
- `server/auth/`: cấu hình Auth.js và `requireOwner()` dùng chung; `server/db/`: Prisma client; `server/repositories/`: truy vấn; `server/services/`: quy tắc nghiệp vụ; `server/schemas/`: schema Zod. Các module này chỉ được import phía server.
- Giữ endpoint `/api/notes`, `/api/ticket`, `/api/blog`, `/api/userprofile` khi chuyển từng nhóm để giảm thay đổi client. Thiết kế thêm endpoint theo resource cho bài viết, bình luận và profile; loại bỏ hành vi API hiện tại trả `status: 400` trong JSON nhưng HTTP vẫn là 200.
- SWR tiếp tục quản lý cache client; sau mutation phải revalidate đúng key. Không đặt quyền truy cập chỉ ở context/component.

## 5. Backend và trình tự thực hiện

### Giai đoạn 0 — Khóa rủi ro, chốt phạm vi

- Vô hiệu hóa hoặc giới hạn `/api/code`; rà mọi Route Handler public và endpoint chưa dùng.
- Ghi inventory dữ liệu + hợp đồng API hiện tại, xác định nơi triển khai, domain và các dataset demo cần giữ.
- **Điều kiện qua giai đoạn:** endpoint đọc file không còn cho phép truy cập file tùy ý; có danh sách route/data cần bảo vệ.

### Giai đoạn 1 — GitHub và tài khoản nội bộ, quyền OWNER (ưu tiên đầu tiên)

- Tích hợp Auth.js với GitHub allowlist ID `129001260` và Credentials provider kiểm tra `OWNER_LOGIN_USERNAME` + `OWNER_PASSWORD_HASH`; cả hai tạo session JWT cho cùng owner ID. Đổi trường Email mẫu trên trang login thành Username. Tạo hash Argon2id bằng lệnh/script chạy cục bộ, chỉ đưa hash vào env; không đưa password rõ vào lịch sử shell, Git hay tài liệu.
- Thêm giới hạn tốc độ đăng nhập, lỗi chung cho thông tin sai, trang login hai lựa chọn, logout và `proxy.ts`. Cấu hình thời hạn JWT; khi thay password và cần thu hồi phiên cũ, xoay `AUTH_SECRET` (mọi phiên phải đăng nhập lại).
- Thêm `requireOwner()` cho tất cả API hiện có, route nhạy cảm và mọi mutation; xử lý 401/403 đúng mã HTTP. Các trang dashboard yêu cầu session; route OAuth/login hoạt động khi chưa đăng nhập.
- Loại bỏ luồng auth template gây hiểu nhầm và cập nhật header/profile theo session được xác minh.
- **Điều kiện nghiệm thu:** GitHub đúng và username/password nội bộ đúng đều vào cùng dữ liệu owner; GitHub account khác, username/password sai và tài khoản chưa đăng nhập đều bị chặn ở trang/API; giới hạn thử sai hoạt động; logout làm mất quyền; không có Google login hoặc đăng ký công khai.

### Giai đoạn 2 — Nền tảng PostgreSQL

- Cấp database local và production tách biệt; thêm Prisma schema/migrations, một DB client server-only, quản lý secret `DATABASE_URL` và quy trình backup/restore.
- Tạo các model theo mục 4, constraint/index và seed idempotent từ snapshot dữ liệu hiện tại. Seed đúng một `Owner` ứng với owner ID đã dùng ở JWT; cả hai phương thức đăng nhập truy cập cùng các record. Giữ JWT session vì Credentials provider của Auth.js không hỗ trợ database session.
- **Điều kiện nghiệm thu:** migration áp dụng được trên DB mới, seed chạy lặp không nhân bản dữ liệu, dữ liệu tồn tại sau restart và có bản backup thử khôi phục.

### Giai đoạn 3 — Đưa từng chức năng sang backend lưu bền

- Theo thứ tự: Notes → Tickets → Blog → OwnerProfile → social/profile demo → dashboard/bảng demo. Với mỗi nhóm: Zod input → Route Handler mỏng → service/repository → Prisma → cập nhật SWR/context và UI → đối chiếu dữ liệu seed.
- Blog cần hoàn thiện create/edit/delete/publish và comment ở server; profile cần Save thật; loại bỏ reset-on-refresh của Notes/Tickets. Trả status code thật, có phân trang/tìm kiếm khi dữ liệu tăng, không để client tự sửa bộ nhớ như nguồn sự thật.
- **Điều kiện nghiệm thu:** thêm/sửa/xóa còn nguyên sau reload/restart; không lộ dữ liệu qua API chưa xác thực; số bản ghi và các trường quan trọng khớp inventory.

### Giai đoạn 4 — Triển khai

- Sửa Dockerfile thành build/chạy Next standalone bằng pnpm + Node **hoặc** triển khai lên nền tảng hỗ trợ Next Route Handlers; chọn một đường triển khai rõ ràng. Cấu hình HTTPS, OAuth callback production, secret, PostgreSQL, migration trước khi mở traffic, logging không ghi token/secret, backup.
- Kiểm tra luồng OAuth và dữ liệu trên môi trường staging/domain thật trước production; có kế hoạch rollback ứng dụng và DB.
- **Điều kiện nghiệm thu:** GitHub owner và tài khoản nội bộ đều vào được cùng dữ liệu; account khác bị chặn ở trang/API; dữ liệu còn sau redeploy, backup khôi phục được, `/api/code` không đọc file tùy ý và không lộ env.

## 6. Việc cần chốt trước khi bắt đầu triển khai

1. Domain/hosting production và nơi đặt PostgreSQL (đề xuất: managed PostgreSQL gần app; nếu tự host, cần quy trình backup, TLS và cập nhật hệ thống).
2. Xác nhận ID GitHub `129001260` khi OAuth callback đầu tiên chạy bằng chính tài khoản của chủ dự án; chọn username nội bộ và tạo mật khẩu mạnh/hash Argon2id ở môi trường kín. Không đưa giá trị thật vào plan hoặc repository.
3. Xác nhận mọi dữ liệu trình diễn ở dashboard/tables/social có cần lưu vào DB hay chỉ cần giữ khả năng hiển thị. Mặc định của kế hoạch: **lưu snapshot có phiên bản**, không biến các số demo thành nghiệp vụ thật.
4. Chính sách phiên: giữ JWT khi dùng Auth.js Credentials. Nếu sau này cần thu hồi từng phiên/thiết bị, phải thiết kế cơ chế revocation riêng hoặc chuyển tài khoản nội bộ sang giải pháp auth/session khác sau một quyết định mới. Không lưu GitHub access token nếu ứng dụng chỉ dùng GitHub để xác thực danh tính.

## Tài liệu chính thức đã đối chiếu

- [Auth.js — cài đặt với Next.js](https://authjs.dev/getting-started/installation)
- [Auth.js — cấu hình GitHub](https://authjs.dev/guides/configuring-github)
- [Auth.js — Credentials provider](https://authjs.dev/getting-started/authentication/credentials)
- [Auth.js — Credentials yêu cầu JWT session](https://authjs.dev/reference/core/providers/credentials)
- [Auth.js — callback `signIn` và JWT/session](https://authjs.dev/reference/core)
- [OWASP — lưu password bằng Argon2id và salt](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [GitHub — ID bền so với login có thể đổi](https://docs.github.com/en/rest/users/users?apiVersion=2022-11-28#get-a-user-using-their-id)
- [GitHub — tạo OAuth App](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)
- [Next.js — authorization ở DAL/Route Handler và vai trò của Proxy](https://nextjs.org/docs/app/guides/authentication)
- [Prisma — dùng PostgreSQL với Next.js](https://www.prisma.io/docs/guides/frameworks/nextjs)
- [Better Auth — database và chế độ stateless](https://better-auth.com/docs/installation)
- [Drizzle — migrations](https://orm.drizzle.team/docs/kit-overview)
