# Hướng dẫn sử dụng khu vực Developer

Khu vực Developer gồm Tổng quan, AI Usage, Developer Feed và Kết nối. Dữ liệu GitHub và Codex được lưu trong Supabase sau khi bạn kết nối tài khoản hoặc ghép đôi Mac.

Bắt đầu tại **http://localhost:3000/developer/connections** sau khi đăng nhập bằng tài khoản chủ ứng dụng. Khi sử dụng bản đã triển khai lên website, thay địa chỉ local bằng địa chỉ website tương ứng. Các thay đổi này chưa được triển khai lên cloud trong đợt xây dựng ban đầu.

## 1. Kết nối tài khoản GitHub

Ví dụ: bạn có một tài khoản cá nhân và một tài khoản công việc; tài khoản công việc tham gia nhiều organization. Tạo một kết nối cho mỗi tài khoản, sau đó chọn các repository cần theo dõi trong từng kết nối.

### Thêm tài khoản

1. Mở **Developer → Kết nối**.
2. Trong khung **Kết nối GitHub**, nhập **Tên hiển thị**, ví dụ `GitHub cá nhân` hoặc `GitHub công việc`.
3. Dán token của tài khoản vào ô **Token repository**. Token cần có quyền đọc những repository bạn muốn theo dõi.
4. Nếu muốn dùng Inbox, nhập thêm token vào ô **Token classic cho Inbox (notifications)**. Token này phải thuộc cùng tài khoản GitHub với token repository.
5. Đánh dấu **Tài khoản công việc** nếu đây là tài khoản dùng cho công việc.
6. Bấm **Xác minh & lưu**. Backend kiểm tra danh tính thật của token; tên hiển thị không quyết định tài khoản GitHub được kết nối.

Token đọc repository và token Inbox có thể khác nhau. Với repository thuộc organization, quyền truy cập thực tế còn phụ thuộc chính sách của organization và phê duyệt SSO nếu có. Không dán token vào tài liệu, mã nguồn hoặc tin nhắn.

### Chọn dự án cần theo dõi

1. Sau khi kết nối thành công, danh sách repository bạn có quyền truy cập xuất hiện trong form.
2. Tích chọn các repository cần theo dõi. Tên đầy đủ có dạng `organization/repository`.
3. Bấm **Tải repository** nếu cần xem thêm các trang kết quả.
4. Bấm **Xác minh & lưu** lần nữa để lưu lựa chọn.
5. Bấm **Đồng bộ dữ liệu**. Bạn cũng có thể về trang Tổng quan và bấm nút tải lại ở thanh công cụ.

Mỗi kết nối hỗ trợ chọn tối đa 50 repository. Với tài khoản GitHub khác, bấm **Thêm tài khoản** rồi thực hiện lại các bước trên.

### Sửa, tạm dừng hoặc xóa kết nối

- **Thiết lập:** mở lại cấu hình để sửa tên, thay token hoặc đổi danh sách repository. Khi sửa, có thể để trống ô token để giữ token cũ.
- **Tạm dừng / Tiếp tục:** dừng hoặc bật lại việc đồng bộ. Tạm dừng giữ dữ liệu đã thu thập.
- **Xóa kết nối:** xóa credential, tiến độ đồng bộ và snapshot GitHub của kết nối đó khỏi ứng dụng.

Thay token không làm thay đổi tài khoản của kết nối hiện tại. Nếu token thuộc tài khoản khác, tạo kết nối mới.

## 2. Xem hoạt động GitHub trên Tổng quan

Mở **Developer → Tổng quan** hoặc **http://localhost:3000/developer**.

### Đồng bộ dữ liệu

- Khi mở khu vực Developer, ứng dụng thử đồng bộ các kết nối đang bật.
- Nút tải lại ở thanh công cụ yêu cầu tiếp tục hoặc bắt đầu đồng bộ.
- Sau một lần đồng bộ thành công, hệ thống chờ ít nhất 5 phút trước khi bắt đầu lượt mới. Bấm tải lại trong thời gian này không ép GitHub cập nhật ngay.
- Việc đồng bộ được chia thành các bước và lưu tiến độ. Nếu bị gián đoạn, lần mở trang tiếp theo có thể tiếp tục.
- Khi đồng bộ gặp lỗi, snapshot hoàn chỉnh trước đó được giữ lại nếu có. Sau khi đổi danh sách repository, snapshot cũ bị xóa để không tiếp tục hiển thị dữ liệu của repo đã bỏ chọn.
- Chưa có lịch tự đồng bộ GitHub khi bạn đóng dashboard.

### Lịch đóng góp và các chỉ số

Chọn khoảng **Hôm nay**, **7 ngày** hoặc **30 ngày** trên thanh công cụ để xem các chỉ số tương ứng. Bộ lọc tài khoản trong phần Contributions giúp xem từng tài khoản hoặc gộp các tài khoản đã kết nối.

Lịch đóng góp hiển thị cửa sổ 365 ngày và lấy số tổng hợp theo định nghĩa của GitHub khi credential hỗ trợ. Chi tiết commit, PR, review và dòng code thay đổi được thu thập trên các repository đã chọn trong 30 ngày gần nhất. Hai phạm vi này có thể cho số liệu khác nhau.

### Popup hoạt động 7 ngày

1. Tại mục **Inbox**, bấm **Hoạt động GitHub · 7 ngày**.
2. Xem các nhóm theo **Ngày → Repository**; hôm nay nằm trên cùng, dùng giờ Việt Nam (UTC+7).
3. Lọc theo tài khoản, tổ chức/chủ sở hữu, repository hoặc loại hoạt động.
4. Tìm theo tên repository, commit message hoặc tiêu đề PR.
5. Bấm tiêu đề hoạt động để mở liên kết trên GitHub.
6. Bấm **Xóa bộ lọc** để quay lại toàn bộ kết quả; đóng popup bằng nút X hoặc Escape.

Popup hỗ trợ commit, mở PR, merge PR và review. Dữ liệu chỉ bao gồm phần lịch sử backend đọc được: branch đã xóa hoặc repository chưa được cấp quyền có thể thiếu hoạt động.

## 3. Dùng Inbox và báo cáo

### Inbox

- Số cạnh tiêu đề Inbox là số thông báo chưa đọc trong dữ liệu đã đồng bộ.
- Dùng bộ lọc tài khoản, loại thông báo, trạng thái đọc và ô tìm kiếm để thu hẹp danh sách.
- Bấm một thông báo để xem chi tiết.
- **Đánh dấu đọc** cập nhật trạng thái trên GitHub rồi cập nhật lại dashboard. Nếu GitHub từ chối thao tác, ứng dụng không tự coi thông báo là đã đọc.
- Hiện chưa hỗ trợ đánh dấu thông báo đã đọc thành chưa đọc.

Kết nối repository thành công chưa có nghĩa Inbox đã được cấp quyền. Kiểm tra token Inbox nếu có dữ liệu repository nhưng không có thông báo.

### Báo cáo

1. Chọn khoảng ngày trên thanh công cụ Developer.
2. Bấm **Báo cáo**.
3. Xem tổng hợp hoạt động, token đã ghi nhận, số thông báo chưa đọc và thời điểm cập nhật của từng nguồn.
4. Bấm **Tải báo cáo .txt** để lưu về máy.

Báo cáo tổng hợp bằng quy tắc từ dữ liệu đã thu thập; không gọi thêm AI để viết nội dung.

## 4. Kết nối Codex trên Mac

Tính năng này đọc **usage của gói ChatGPT dùng trong Codex**, qua `codex app-server`. Không cần tạo OpenAI API key. Dashboard chỉ nhận danh tính hiển thị, gói, tổng token theo ngày và các cửa sổ quota; đăng nhập ChatGPT vẫn nằm trên Mac.

### Ghép tài khoản cá nhân đang dùng trên Mac

1. Cài Codex CLI từ nguồn chính thức và kiểm tra `codex --version`.
2. Mở **Developer → Kết nối → Codex · ChatGPT**. Nhập tên, chọn nhóm **Cá nhân** hoặc **Công việc**, bấm **Thêm Codex**.
3. Ở tài khoản vừa thêm, bấm **Ghép Mac**. Mã chỉ dùng một lần, hết hạn sau 10 phút.
4. Mở Terminal tại thư mục repository này và chạy:

```bash
DEVELOPER_ORIGIN=http://localhost:3000 DEVELOPER_PROFILE=personal pnpm developer:companion setup
```

5. Companion kiểm tra đăng nhập Codex đang có. Nếu chưa đăng nhập ChatGPT, nhập `y` khi được hỏi để mở `codex login`. Hoàn tất đăng nhập bằng tài khoản muốn theo dõi.
6. Khi Terminal hỏi mã ghép, dán mã trong popup. Mã không cần ghi vào lệnh hoặc biến môi trường.
7. Quay lại **Kết nối**, bấm **Xác nhận danh tính** trên Mac vừa ghép, kiểm tra email/workspace rồi bấm **Liên kết với tài khoản này**. Trước bước này dữ liệu chưa được nhập vào lịch sử.
8. Cài tiến trình nền:

```bash
DEVELOPER_ORIGIN=http://localhost:3000 DEVELOPER_PROFILE=personal pnpm developer:companion install
```

Mac gửi heartbeat mỗi 60 giây, lấy số liệu mỗi 5 phút. Nút **Đồng bộ ngay** tạo yêu cầu cho Mac; khi Mac online, companion nhận yêu cầu qua heartbeat tiếp theo. Mac ngủ hoặc mất mạng thì yêu cầu phải chờ.

### Tài khoản công việc dùng profile riêng

`DEVELOPER_PROFILE` đặt tên companion; `DEVELOPER_CODEX_HOME` chọn nơi Codex lưu đăng nhập. Để giữ tài khoản cá nhân hiện tại, tạo thư mục Codex riêng cho công việc:

```bash
DEVELOPER_ORIGIN=http://localhost:3000 DEVELOPER_PROFILE=work DEVELOPER_CODEX_HOME="$HOME/.codex-work" pnpm developer:companion setup
DEVELOPER_ORIGIN=http://localhost:3000 DEVELOPER_PROFILE=work DEVELOPER_CODEX_HOME="$HOME/.codex-work" pnpm developer:companion install
```

Tạo tài khoản nhóm **Công việc** trên web trước khi lấy mã. Trong luồng `setup`, đăng nhập đúng tài khoản/workspace công ty. Companion không đăng xuất hoặc đổi đăng nhập của profile cá nhân. `install` lưu đường dẫn profile vào LaunchAgent để các lần chạy nền dùng cùng đăng nhập.

Khi đổi danh tính trong profile, web yêu cầu xác nhận lại. Chọn **Tạo tài khoản mới cho danh tính này** để lịch sử cũ ở lại tài khoản cũ. Nếu danh tính đã được xác nhận ở tài khoản khác, chọn nút liên kết với tài khoản đó; nhiều Mac cùng tài khoản dùng chung bucket ngày, không cộng chồng tổng của từng Mac. App-server chưa cung cấp ID tài khoản bền vững; nếu workspace không có tên, cần tự kiểm tra đúng workspace trước khi xác nhận.

### Kiểm tra, đồng bộ thủ công và gỡ companion

```bash
DEVELOPER_ORIGIN=http://localhost:3000 DEVELOPER_PROFILE=personal pnpm developer:companion status
DEVELOPER_ORIGIN=http://localhost:3000 DEVELOPER_PROFILE=personal pnpm developer:companion uninstall
DEVELOPER_ORIGIN=http://localhost:3000 DEVELOPER_PROFILE=personal pnpm developer:companion sync --once
```

`status` hiển thị trạng thái lần liên lạc/thu thập/gửi gần nhất và số batch chờ, không hiện token. Muốn chạy `sync --once` thủ công, dừng tiến trình nền bằng `uninstall` trước; chỉ một tiến trình được dùng hàng đợi của một profile. Chạy lại `install` sau khi kiểm tra xong. `uninstall` giữ credential và lịch sử. **Thu hồi** trên web chặn ngay credential Mac; **Tạm dừng** dừng nhận dữ liệu mới; cả hai đều giữ lịch sử. Muốn **Xóa lịch sử**, phải tạm dừng tài khoản và xác nhận riêng; đồng bộ lại có thể nhập lại ngày cũ do Codex cung cấp.

Credential thiết bị nằm trong **macOS Keychain**, service `work.vodinhquan.developer.companion`. Metadata và tối đa 20 batch chờ được lưu trong `~/.developer-companion`, thư mục quyền `700`, file `600`. Hàng đợi loại batch quá 30 ngày. Batch dùng ID cố định khi gửi lại; dữ liệu ngày là tổng tuyệt đối, ưu tiên lần quan sát mới hơn. Không lấy prompt, source code hay log hội thoại.

### Nâng cấp companion cũ

Với companion v1, phải chỉ rõ địa chỉ đã ghép để tránh đưa token local sang production:

```bash
DEVELOPER_ORIGIN=http://localhost:3000 DEVELOPER_MIGRATE_ORIGIN=http://localhost:3000 DEVELOPER_PROFILE=dashboard-local pnpm developer:companion sync --once
DEVELOPER_ORIGIN=http://localhost:3000 DEVELOPER_PROFILE=dashboard-local pnpm developer:companion install
```

Chỉ dùng địa chỉ đúng với kết nối cũ. Credential được ghi vào Keychain, đọc lại đối chiếu thành công rồi mới xóa token khỏi file cũ. Nếu Keychain lỗi, token cũ được giữ. Web có thể yêu cầu xác nhận lại danh tính sau nâng cấp. Không cần tạo mã ghép mới cho Mac đã chuyển đổi thành công.

### Sau khi deploy lên vodinhquan.work

Đợi server áp dụng đủ migration và cấu hình server bên dưới. Mở **https://vodinhquan.work/developer/connections**, tạo tài khoản, lấy **mã ghép mới trên production**, sau đó:

```bash
DEVELOPER_ORIGIN=https://vodinhquan.work DEVELOPER_PROFILE=personal-prod pnpm developer:companion setup
DEVELOPER_ORIGIN=https://vodinhquan.work DEVELOPER_PROFILE=personal-prod pnpm developer:companion install
```

Dùng `personal-prod`/`work-prod` để LaunchAgent production chạy riêng với local. Token thiết bị gắn với môi trường, không sao chép token hay mã ghép local lên production. Token thiết bị không đặt ngày hết hạn; có hiệu lực cho đến khi thu hồi. Phiên đăng nhập ChatGPT vẫn có thể cần đăng nhập lại theo yêu cầu của nhà cung cấp.

### Đọc số liệu AI Usage

Tổng quan, AI Usage và báo cáo cùng đọc bucket ngày đã lưu. Bộ lọc chọn tài khoản và khoảng ngày. Ngày thiếu không coi là `0`; có bucket `0` mới hiện số 0. Dữ liệu giữ ngày do Codex cung cấp, không tự đổi bucket theo múi giờ. Thời điểm quan sát/reset hiển thị theo `Asia/Ho_Chi_Minh`.

Quota hiển thị từng bucket và cửa sổ primary/secondary, phần trăm đã dùng/còn lại, độ dài cửa sổ và thời điểm reset. Số liệu cũ hoặc đã qua reset được đánh dấu chờ cập nhật, không tự tính thành 100% còn lại. Nếu phiên bản Codex không hỗ trợ usage/quota, trạng thái là `unsupported`/`unavailable`; lỗi tạm thời giữ dữ liệu quan sát trước đó cùng thời điểm cũ. Không có số liệu theo model, phiên, input/output hoặc tốc độ sinh token vì nguồn này không cung cấp các số đó.

## 5. Developer Feed và bài đã lưu

Mở **Developer → Developer Feed** để đọc bài từ daily.dev, tìm kiếm, lọc chủ đề và sắp xếp. Bấm biểu tượng bookmark để lưu hoặc bỏ lưu bài; tab **Đã lưu** hiển thị các bài đã lưu trong Supabase.

Feed cần cấu hình daily.dev trên server. Nếu Feed báo lỗi cấu hình hoặc token, kiểm tra cấu hình server ở phần dưới; kết nối GitHub không tự cấp quyền cho daily.dev.

## 6. Các lỗi thường gặp

| Mã hoặc biểu hiện | Cách xử lý |
| --- | --- |
| `unauthenticated` | Đăng nhập lại dashboard bằng tài khoản chủ ứng dụng. |
| `credential_expired` | Thay token GitHub trong **Thiết lập**, rồi bấm **Xác minh & lưu**. |
| `permission_required` / `repository_unavailable` | Kiểm tra quyền repository, chính sách organization và phê duyệt SSO. |
| `account_mismatch` / `inbox_account_mismatch` | Kiểm tra các token có thuộc đúng cùng một tài khoản GitHub hay không. |
| `account_already_connected` | Sửa kết nối đã có thay vì thêm trùng tài khoản. |
| `rate_limited` | Chờ thời gian giới hạn của GitHub rồi thử lại; bấm liên tục không bỏ qua được giới hạn. |
| `pairing_expired` | Tạo mã mới ở **Ghép đôi Mac**; mã cũ có thể đã hết hạn hoặc đã dùng. |
| `device_revoked` | Ghép đôi lại nếu muốn tiếp tục cho thiết bị gửi dữ liệu. |
| `companion_not_configured` | Kiểm tra credential Supabase dành cho server theo phần cấu hình bên dưới. |
| `ChatGPT login required in this Codex profile` | Đăng nhập Codex bằng ChatGPT trong đúng thư mục profile đang cấu hình. |
| `identity_confirmation_required` | Mở Kết nối, kiểm tra email/workspace của Mac và xác nhận. |
| `identity_already_linked` | Liên kết Mac với tài khoản đã có cùng danh tính. |
| `new_account_required` | Profile đã đổi danh tính; tạo tài khoản mới để giữ lịch sử cũ riêng. |
| `unsupported` / `unavailable` | Nguồn Codex chưa hỗ trợ hoặc chưa trả dữ liệu; cập nhật CLI và kiểm tra đăng nhập. |
| Đã bấm tải lại nhưng số liệu chưa đổi | Kiểm tra thời gian chờ 5 phút, kết nối tạm dừng, lỗi nguồn hoặc Mac chưa hoạt động. |

## 7. Cấu hình server dành cho người triển khai

Phần này dành cho việc thiết lập môi trường, không phải thao tác hằng ngày trên dashboard.

### Cơ sở dữ liệu

Migration liên quan: `20261105000100_developer.sql`, `20261105000200_developer_companion_grants.sql` và các migration `20261105000300`–`20261105000600` trong `supabase/migrations/`. Bản local đã áp dụng; production phải áp dụng cùng schema trước khi chạy code mới.

Migration này đã được áp dụng trên Supabase local trong đợt xây dựng ban đầu. Với môi trường khác, áp dụng theo quy trình migration của dự án. Không chạy reset database để thiết lập tính năng này.

### Biến môi trường

| Biến | Mục đích |
| --- | --- |
| `DEVELOPER_ENCRYPTION_KEY` | Khóa mã hóa token GitHub phía server: 32 byte ngẫu nhiên, biểu diễn bằng 64 ký tự hex. |
| `SUPABASE_SERVICE_ROLE_KEY` | Credential Supabase phía server cho ghép đôi và nhận số liệu companion. Không đưa vào biến `NEXT_PUBLIC_*`. |
| `DAILY_DEV_TOKEN` | Credential phía server cho Developer Feed. |
| `DAILY_DEV_FEED_ENABLED` | Đặt `true` để cho phép Feed trên production. |

Giữ cấu hình owner/auth hiện có của dự án. Trong đợt xây dựng ban đầu, khóa mã hóa và credential server Supabase local đã được bổ sung vào file `.env.development.local` được Git bỏ qua. Không sao chép credential local lên cloud; cấu hình giá trị riêng cho từng môi trường. Khởi động lại dev server nếu tiến trình chưa nạp giá trị môi trường mới.

Giữ ổn định và sao lưu khóa mã hóa. Đổi khóa mà không mã hóa lại credential đang lưu sẽ khiến các token cũ không đọc được. Dữ liệu mã hóa hiện dùng phiên bản `v1`.

### Kiểm tra kỹ thuật

- `pnpm test:developer:live`: kiểm tra mã hóa/chống sửa token, lỗi GitHub, giới hạn truy cập, ngày báo cáo và đối chiếu token.
- `pnpm test:developer:codex:api`: chạy HTTP thật trên localhost, kiểm tra pairing một lần, xác thực, validation, throttle và revoke bằng fixture riêng được dọn sau test. Cần dev server và Supabase local đang chạy.
- `pnpm test:developer:codex`: kiểm tra batch, ngày thiếu/0, quota, lifecycle, Keychain migration và app-server thoát bất thường.
- `docker exec -i supabase_db_dashboard-personal-local psql -U postgres -d postgres -q -f - < scripts/developer/test-codex.sql`: kiểm tra SQL trong transaction rollback, không xóa dữ liệu thật.
- `pnpm test:developer`: kiểm tra các phép tổng hợp của domain Developer.
- `node --test scripts/backend/auth-policy.test.mjs`: kiểm tra chính sách quyền truy cập API.
- `node scripts/test-developer-feed.mjs`: kiểm tra luồng Feed.
- `pnpm build`: kiểm tra TypeScript và production build.

Collection tại `postman/developer.postman_collection.json` chứa các request cho owner, không chứa credential thật. Collection chưa được chạy với tài khoản GitHub thật hoặc công bố lên workspace Postman. Phiên bản CLI được kiểm tra trong đợt xây dựng ban đầu không hỗ trợ lệnh `postman status`.

Để nghiệm thu thực tế, cần kết nối token GitHub, kiểm tra quyền organization và ghép đôi Mac. Build hoặc kiểm thử local thành công chưa chứng minh toàn bộ dữ liệu upstream đã đầy đủ, thiết bị đã đồng bộ thật hoặc giao diện desktop/mobile đã đạt yêu cầu.

### Rollback Codex

Dừng companion của môi trường bị lỗi bằng `uninstall`, giữ lại Keychain và các bảng Codex. Rollback bản ứng dụng theo quy trình deploy hiện có; không drop bảng hoặc chạy reset. Companion v1 không dùng được credential đã chuyển vào Keychain, vì vậy ưu tiên sửa tiến về bản v2 rồi cài lại `install`. Các document v1 còn được giữ phục vụ đối chiếu; chúng không tiếp tục cập nhật. Sao lưu database trước migration production theo quy trình backend của repository.
