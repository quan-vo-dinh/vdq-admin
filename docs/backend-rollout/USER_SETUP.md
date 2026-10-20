# Checklist cấu hình người dùng

Tham chiếu: [index v2](README.md). Cập nhật sau P00/P01 và tinh gọn plan ngày 2026-10-20; các mục đã hoàn tất giữ nguyên, không setup lại. Các ô trống là việc chưa làm/chưa xác minh, không phải yêu cầu gửi secret trong chat. Xem [evidence P01](evidence/P01.md) và [bàn giao](HANDOFF.md).

## Đã có theo thông tin bạn cung cấp

- Organization Free: bin's projects.
- Project: dasboard-vodinhquan, ref `wcgdvsiiemurehkprvqw`, URL `https://wcgdvsiiemurehkprvqw.supabase.co`.
- Region: Mumbai `ap-south-1`; trạng thái Healthy/nano tại lúc chụp.
- P01 xác minh live đúng ref/Free/Mumbai, public schema chưa có business tables; chưa deploy migration. Data API ON, auto-expose đã OFF, automatic RLS trigger enabled. Tài khoản owner organization không tự là auth user của app.

## U00 — P00: dữ liệu và máy local

- [x] P00 inventory xong, không có server dashboard đang chạy; không reload tab Developer. Không có dữ liệu thật trong state cần cứu theo xác nhận user.
- [x] User xác nhận **toàn bộ data hiện tại trong scope là mock, có thể bỏ khi cutover**; production rỗng. Ngoài scope giữ nguyên mock/fake/source. Calendar/Today demo đã snapshot/decrypt verify.
- [x] Docker Engine 29.2.1 qua Docker Desktop chạy được stack local, reset và dump. Phiên kết thúc chỉ stop stack Supabase này, giữ các service Docker khác.
- [ ] **P09, không chặn P02–P08:** chọn nơi backup cá nhân ngoài Git và giữ recovery key trong password manager trước dữ liệu thật. Demo encrypted snapshot tạm ở `~/Library/Application Support/dashboard-backend-rollout/2026-10-20/`, key demo riêng ở `~/.config/dashboard-backend-rollout/demo-recovery/`; không coi đây là recovery setup đã nghiệm thu.

## U01 — P01: Supabase project và settings

Mở project Dashboard → Settings → Data API/API Keys (tên menu có thể thay đổi):

- [x] P01 live xác nhận đúng ref `wcgdvsiiemurehkprvqw`, Free plan và region `ap-south-1`.
- [x] **Enable Data API: ON** để repository dùng supabase-js.
- [x] **Automatically expose new tables: OFF** (P01 đã đổi ON → OFF, Save và kiểm tra persisted); migrations sẽ GRANT tối thiểu từng object. Khi toggle đã bật trước đó, vẫn rà/revoke grants tồn tại.
- [x] Catalog xác nhận automatic RLS trigger `ensure_rls` enabled, không thấy toggle riêng; SQL migrations vẫn ENABLE RLS rõ ràng và test, không phụ thuộc toggle.
- [x] Local URL/key đã tạo trong ignored `.env.development.local` (0600); `.env.local` Developer giữ nguyên.
- [x] Cloud publishable key sẵn có đã lấy từ Dashboard vào ignored `.env.cloud-tooling.local` (0600), chỉ dùng preflight explicit; Next không auto-load tên này. Auth settings GET với key 200/không key 401. Không mở secret key; cấu hình app production/origin tại Vercel vẫn thuộc P11.
- [x] Cloud CLI link/schema dump đã chạy được bằng credential sẵn có, qua session pooler Mumbai port 5432; schema restore local tách biệt PASS. Không cần user nhập password mới trong phiên, không mua IPv4 add-on.
- [ ] User giữ database password/recovery access trong password manager (chưa xác minh); đây là việc vận hành trước dữ liệu thật, không còn là blocker P01 tooling. Không đưa credentials vào browser/APK/chat.
- [x] CLI existing login tại máy đã dùng được: read-only `projects list` lọc đúng ref, ACTIVE_HEALTHY; không tạo token mới; bước link tiếp theo đã thành công cho read-only schema tooling, `.temp` được ignore. Nếu máy khác chưa login, user chạy `pnpm exec supabase login` tại máy; token chỉ trong credential store/CI secret. Không dán token vào chat.
- [x] P01 live Settings/Integrations: chưa chọn GitHub repository để connect, không tạo schema auto-deploy; Vercel integration chưa cài. Chỉ dùng CLI cho schema, remote migrations chờ P11. Không chạy `db push` hoặc remote reset.

P01 đã link được workspace và hoàn tất read-only schema preflight. Trên máy mới, user có thể chạy `pnpm exec supabase login`, rồi `pnpm exec supabase link --project-ref wcgdvsiiemurehkprvqw` và nhập password qua prompt kín nếu CLI yêu cầu (không dùng `--password` literal trong command/chat). **Chưa chạy `db push`/remote reset**; remote migrations chỉ P11. Link có thể cache versions cloud trong `.temp`; xem runbook về khác biệt local trước/sau link.

Không cần mua IPv4 add-on: nếu direct DB connection không hoạt động do mạng IPv6, chọn session pooler từ Connect cho tooling khi được hỗ trợ; app CRUD vẫn qua HTTPS Data API. Test khả năng dump/restore với kết nối đã chọn.

## U03 — P03: GitHub OAuth và owner

**2026-10-20: U03 local hoàn tất, P03 PASS.** OAuth App 3948289, secret env kín 0600,
GitHub owner `quan-vo-dinh` / numeric ID `129001260` đã bind. Signup đã đóng; browser login/logout/relogin,
reload/header và session API đã kiểm chứng thật. Stack Supabase + Next :3000 đang chạy. Cloud setup vẫn P11.
Các bước bên dưới là runbook tham khảo; **không mở lại signup/reset/bootstrap lại owner hiện có**.


1. GitHub → Settings → Developer settings → OAuth Apps → New OAuth App (local riêng):
   - Homepage: `http://localhost:3000`.
   - Authorization callback: `http://127.0.0.1:54321/auth/v1/callback`.
   - Tạo Client Secret và lưu kín; không gửi chat/Git. Không dùng callback NextAuth.
2. Tạo `.env.supabase.local` tại repo (được ignore), `chmod 600 .env.supabase.local`, nội dung:

   ```dotenv
   SUPABASE_AUTH_EXTERNAL_GITHUB_CLIENT_ID=<local-client-id>
   SUPABASE_AUTH_EXTERNAL_GITHUB_SECRET=<local-client-secret>
   ```

3. Trong `supabase/config.toml`, **chỉ lúc bootstrap local** đổi `[auth] enable_signup = true`
   và `[auth.external.github] enabled = true`. Giữ email/SMS/anonymous/manual linking tắt.
   Site URL hiện `http://localhost:3000`, callback Next đã allowlist chính xác; dùng host localhost nhất quán.
   Restart riêng stack để áp config (không reset DB):

   ```bash
   pnpm backend:local:stop
   pnpm backend:local:start
   pnpm exec supabase migration up --local
   pnpm dev
   ```

   Nếu dev server đang chạy thì dùng server đó. Chỉ restart Next sau khi cập nhật owner env dưới đây.
4. Mở [login local](http://localhost:3000/auth/auth2/login), sign-in GitHub chính chủ và consent.
   Lần đầu callback sẽ **từ chối owner** vì registry chưa có; auth.user/identity đã được Auth tạo.
   Đây là bootstrap có kiểm soát, không có endpoint đăng ký owner công khai.
5. Lấy **numeric GitHub ID** của chính mình, đối chiếu tài khoản tại `https://api.github.com/users/<username-cua-ban>` (không lấy email/username làm quyền). Sau đó chạy:

   ```bash
   node scripts/backend/bootstrap-owner.mjs NUMERIC_GITHUB_ID_DA_XAC_MINH
   ```

   Tool chỉ kết nối container local cố định, kiểm tra `auth.identities.provider=github`,
   `provider_id` và `identity_data.sub` khớp numeric ID, đúng một auth user. Registry khác đã có sẽ bị từ chối;
   không thay owner hoặc tự re-enable owner disabled. Tool in `APP_OWNER_USER_ID` + `GITHUB_OWNER_ID` (không phải secret).
   Thêm hai dòng vào `.env.development.local`, giữ nguyên URL/key và `.env.local` Developer.
6. **Đóng signup ngay:** `[auth] enable_signup = false`; giữ GitHub enabled=true,
   email/SMS `enable_signup=false`, anonymous/manual linking=false. Restart riêng Supabase bằng lệnh trên,
   restart Next có kiểm soát để đọc env. Không để cửa sổ bootstrap mở khi dùng thường ngày.
7. Logout → login lại, kiểm tra trang/header và `/api/auth/session` trả 200; reload vẫn owner.
   Thử account GitHub khác nếu có: không được data access; nếu không có, ghi chưa thử OAuth account thứ hai.
   Gửi kết quả cho phiên tiếp để hoàn tất gate P03; fixture non-owner đã test, không thay OAuth thật.

Checklist acceptance:

- [x] OAuth App local + secret kín đã tạo, GitHub provider bật.
- [x] Consent thật, verified numeric provider ID, local registry và hai owner env đã bind.
- [x] Signup đóng sau bootstrap, provider thừa/manual linking tắt; owner login lại được.
- [x] Browser login/logout/relogin/header/cookie trên local đạt.
- [x] Ghi rõ OAuth account thứ hai chưa thử; không dùng tài khoản công ty. Local synthetic non-owner tests PASS.
- [ ] **P11:** OAuth App production callback `https://wcgdvsiiemurehkprvqw.supabase.co/auth/v1/callback`,
  Supabase cloud GitHub settings, tắt email/provider thừa/signup sau hosted bootstrap,
  Site URL/Redirect URL chính xác theo Vercel domain. Chưa áp migration/owner lên cloud trong P03.

Không gửi secrets qua chat. CLI config **local** không cấu hình provider cloud.
Fixture auth test dùng admin magic-link local trong memory để lấy session tổng hợp;
không có email/password fallback trong UI hoặc runtime app.

## U04/U05 — Notes và Calendar

**2026-10-20: P04/P05 PASS local. Không có cấu hình mới cần bạn làm.**

- Đã áp migrations local 00400/00500, giữ owner GitHub/signup đóng và env hiện có.
- Dùng [Notes](http://localhost:3000/apps/notes) và [Calendar](http://localhost:3000/apps/calendar). `/` tiếp tục chuyển Developer theo thay đổi đã có.
- Save thành công là DB commit. Notes/Calendar không còn seed/fallback memory/file.
- Local stack + original Next :3000 vẫn chạy. Nếu khởi động máy lại, dùng local start/dev trong runbook;
  không reset DB đang có dữ liệu. Không cần tạo OAuth App hay bootstrap lại owner.
- U09 backup/recovery và U11 cấu hình cloud/Vercel vẫn chưa hoàn tất, không được suy ra production đã sẵn sàng.
- P10 có thể kiểm tra lại kéo chuột Calendar thực tế: automation native chưa commit được thao tác này;
  move/end-time adapter và date semantics đã qua unit/API tests. Không có resize handle trong UI hiện tại.

- Đính chính theo user: không có trang Today. `/today` và menu đã xóa; không cần setup hoặc nghiệm thu module này.
  Schema/API Today local còn lại là lịch sử, phải rà loại khỏi migration cloud trước P11.

## U06/U07 — Finance và Learning

- [x] Schema/API/UI P06/P07 đã triển khai và test local; không cần account/env/cloud setup mới.
- [x] Finance cấu hình tài khoản/số dư đầu kỳ, khoản dự kiến và startsOn trong nút “Tài khoản & khoản dự kiến”.
  User nhập dữ liệu thật sau P11; hiện không import mock balances/transactions/streaks.
- [x] Learning tại `/apps/tickets` dùng DB; không cần tài khoản ngoài.
- [ ] **Chỉ phục vụ browser QA CSV P06:** Chrome → `chrome://extensions` → ChatGPT → Details →
  bật **Allow access to file URLs** rồi báo đã bật. Extension đã từ chối `setFiles`; user đã trả lời sẽ bật.
  API/SQL CSV đã PASS, full P06 chưa PASS cho đến khi browser import/reload được kiểm chứng.
- [ ] Ảnh goal riêng vẫn thuộc P08/U08; hiện chọn biểu tượng được lưu, file image control tạm disabled
  với thông báo P08. Không lưu base64 vào database.

## U08 — P08: Storage

- [ ] Chưa cần bật upload ngoài scope; chỉ bucket private cho ảnh goal, avatar nếu UI hiện có hỗ trợ chọn ảnh.
- [ ] Kiểm tra policy owner, MIME JPEG/PNG/WebP và max 2 MiB; giữ ảnh mẫu hiện có làm fallback, không public bucket.

## U09 — P09: backup đủ dùng

- [ ] Chọn nơi giữ encrypted backup ngoài project/Git, recovery key giữ riêng trong password manager.
- [ ] Chạy một lệnh backup và một lần restore tách biệt theo P09; bảo vệ cả dữ liệu và ảnh, không chỉ schema.
- [ ] Chọn workflow vận hành: manual chạy thường xuyên (đề xuất hằng ngày khi dùng thật) hoặc lịch trên runner có sẵn. Manual được chấp nhận nếu biết backup gần nhất là recovery point; không cam kết RPO 24h khi chưa có job chạy tin cậy.
- [ ] Không bắt buộc GitHub Actions/hosted scheduler/alert integration để release đầu. Nếu chọn tự động sau, kiểm tra Free quota và secrets đúng quyền; không upload dump rõ.
- [ ] Giữ vài bản backup tốt gần nhất, không xóa bản cuối khi backup mới fail; không mua dịch vụ lưu trữ mặc định.

## U11 — P11: Vercel production

- [ ] Tạo Vercel Hobby project cá nhân, kết nối đúng repository cá nhân và production branch thực tế; không đoán branch tên main khi chưa kiểm tra.
- [ ] Cấu hình env Production theo P11; Preview/Development tách riêng, không thừa hưởng credentials DB thật.
- [ ] Chọn runtime Node được package/Next hỗ trợ và pnpm phù hợp lockfile; region function gần Mumbai (candidate bom1) nếu tài khoản hỗ trợ, chỉ một region trên Hobby.
- [ ] Chốt domain `*.vercel.app`; cập nhật Supabase Site URL + redirect chính xác. Không cần mua domain hay Supabase custom domain.
- [ ] Cho phép migration/import/deploy bản đã đạt QA khi bắt đầu phase thực thi này; lúc đó xử lý tài khoản/consent còn thiếu. Lượt viết tài liệu hiện tại chưa publish.
- [ ] Đăng nhập owner và thử lưu dữ liệu trên domain production, reload/thiết bị khác; xác nhận backup đầu tiên và workflow manual/tự động đã chọn trước dùng dữ liệu thật hằng ngày; không bắt buộc dựng job mới.

## U12 — tương lai Android

- [ ] Chỉ setup nhánh đang làm: PWA cần tên/icon; APK sau mới cần app ID/signing keystore và backup khóa. Native/bearer/deep-link adapter riêng chỉ khi chọn làm native.
- [ ] Phân biệt tự cài APK với phát hành store; không mặc định đăng ký hay trả phí Google Play.

## Env inventory dự kiến

| Giá trị | Ở đâu | Có đưa client? |
| --- | --- | --- |
| NEXT_PUBLIC_SUPABASE_URL | local/dev hoặc Vercel đúng môi trường | Có |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | cùng môi trường URL | Có; quyền vẫn do grants/RLS |
| APP_OWNER_USER_ID, GITHUB_OWNER_ID | server env; cross-check registry | Không |
| APP_ORIGIN | server env, origin allowlist | Không cần |
| GitHub Client Secret | Supabase provider / local config qua secret env | Không |
| DB/migration/backup credentials | tooling hoặc secret store CI | Không |
| Backup encryption key | nơi chạy job; recovery key giữ riêng | Không |

Không thêm service-role/secret admin key vào runtime CRUD chỉ để giải quyết lỗi RLS. `.env.example` chứa placeholder; `.env.local`, dump, keystore, token phải ignore và không log.
