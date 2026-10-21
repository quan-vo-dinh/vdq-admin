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
- [x] **P09:** user chọn `~/Documents/dashboard-backups`, manual hằng ngày. Tool/drill local PASS; **private recovery key còn cần user cất trong password manager** trước dữ liệu thật. Demo encrypted snapshot tạm ở `~/Library/Application Support/dashboard-backend-rollout/2026-10-20/`, key demo riêng ở `~/.config/dashboard-backend-rollout/demo-recovery/`; không coi đây là recovery setup đã nghiệm thu.

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
- [x] P08 đã nối private goal image Storage; không base64 DB. API upload/read/CAS/expiry PASS.
- [ ] P08 browser upload còn chờ quyền file URL như P06; user xác nhận sẽ bật sau (phiên P08/P09).

## U08 — P08: Storage

- [x] Local bucket personal-media private, policy owner prefix, JPEG/PNG/WebP <=2 MiB, API decode ảnh thật.
- [x] Profile/address Save, header, server locale/theme/reload/tab khác và desktop/mobile read đã kiểm.
- [ ] **P08 gate browser upload:** Chrome → `chrome://extensions` → ChatGPT → Details → **Allow access to file URLs**.
  User chọn bật sau; API upload PASS không thay browser filechooser → Save → reload. Không cần tạo bucket/account mới local.
- [ ] P11 áp migration/bucket/policies lên cloud đúng phase, không tự public bucket.

## U09 — P09: backup đủ dùng

- [x] User chọn `~/Documents/dashboard-backups`, **manual hằng ngày**, giữ mặc định 3 bản.
- [x] Một lệnh backup/decrypt + restore DB/Storage tách biệt/remap owner + app read đã PASS local.
  Xem [runbook](BACKUP_RESTORE.md) và [evidence](evidence/P09.md).
- [x] Public/private RSA key đã tạo ngoài Git, private 0600 trong thư mục 0700.
- [ ] **Bạn cần cất recovery private key** `~/.config/dashboard-backup-recovery/private.pem`
  vào password manager/nơi riêng. Đã nói sẽ cất, chưa xác minh thao tác. Không gửi key qua chat.
- [x] Bạn đã chọn chịu trách nhiệm chạy manual; recovery point = bundle thành công gần nhất,
  máy ngủ/tắt không backup. Không có hosted scheduler/RPO 24h cam kết.
- [ ] P11 nối/test **backup nguồn hosted** trước dữ liệu production, vì tool hiện cố định local để tránh nhầm linked cloud.
  Không cần làm lại restore drill nếu không có khác biệt ảnh hưởng. Không mua dịch vụ mặc định.

## U11 — P11: Vercel production

- [ ] Tạo Vercel Hobby project cá nhân, kết nối đúng repository cá nhân và production branch thực tế; không đoán branch tên main khi chưa kiểm tra.
- [ ] Cấu hình env Production theo P11; Preview/Development tách riêng, không thừa hưởng credentials DB thật.
- [ ] Chọn runtime Node được package/Next hỗ trợ và pnpm phù hợp lockfile; region function gần Mumbai (candidate bom1) nếu tài khoản hỗ trợ, chỉ một region trên Hobby.
- [ ] Chốt domain `*.vercel.app`; cập nhật Supabase Site URL + redirect chính xác. Không cần mua domain hay Supabase custom domain.
- [ ] Cho phép migration/import/deploy bản đã đạt QA khi bắt đầu phase thực thi này; lúc đó xử lý tài khoản/consent còn thiếu. Lượt viết tài liệu hiện tại chưa publish.
- [ ] Đăng nhập owner và thử lưu dữ liệu trên domain production, reload/thiết bị khác; xác nhận backup đầu tiên và workflow manual/tự động đã chọn trước dùng dữ liệu thật hằng ngày; không bắt buộc dựng job mới.

## U12 — Web + Android Capacitor

Đã chốt **Capacitor, toàn bộ dashboard**, không hỏi lại PWA/TWA hay chỉ làm một module. [P12](phase-12-mobile-future.md) là kế hoạch hiện hành; chưa có APK.

- [ ] Chốt tên hiển thị/icon/splash dựa trên nhận diện dashboard hiện tại và Android applicationId ổn định. Có thể chuẩn bị asset từ nguồn hiện có; không tự công bố ID/signature cuối.
- [ ] Chọn thiết bị Android thật để kiểm tra (model/RAM/Android/WebView), kết nối cài APK; ghi baseline và performance budgets. Không có thiết bị thì phần nghiệm thu đó vẫn pending.
- [ ] Xác nhận Android Studio/SDK/JDK/licenses và dung lượng công cụ khi bắt đầu thực thi; pin version theo Capacitor đã chọn, không đổi toolchain web tùy tiện.
- [ ] User giữ release signing keystore/password và backup ngoài Git; agent chỉ cần quyền dùng để build, không in key/password vào log/chat. Debug key không phải release key cuối.
- [ ] Chốt chính xác GitHub mobile redirect/App Links sau khi có applicationId và certificate; giữ callback web hiện tại. Không mở signup/manual linking.
- [ ] Cấp cấu hình public API base cho APK; credentials/hash/privileged keys vẫn ở backend. Mobile secure-storage adapter và bearer auth thuộc P12, không phải mục tự hoãn.
- [ ] Phân phối APK nội bộ trước; Google Play/AAB, iOS, OTA hoặc paid build không mặc định trong scope.
- [ ] Nghiệm thu đủ module/flow trong ma trận P12 trên web và Android, gồm file chooser/CSV/goal image, app resume, đăng nhập hai cách và dữ liệu cùng backend. Không dùng quyền/cookie ngoài phiên để vượt gate bị chặn.

Chưa cần cung cấp các giá trị trên trong lượt viết plan. Khi thực thi, chuẩn bị phần kỹ thuật độc lập trước và chỉ hỏi thông tin/consent thật sự còn thiếu; không tự tạo release key hoặc đổi production env trong lượt tài liệu này.

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

## Phiên P10/P11 — 2026-10-20

Đã chạy regression và chuẩn bị migration production riêng; **P10/P11 chưa PASS, chưa cloud push/deploy**. Xem [P10 evidence](evidence/P10.md) và [P11 evidence](evidence/P11.md) cho kết quả mới nhất, ưu tiên hơn trạng thái bàn giao cũ. Build PASS, lint giữ nguyên baseline 17/45, SQL 105/105, API Finance/Learning/personal PASS. Browser file upload vẫn bị quyền Chrome chặn khi thử thực tế. User cần bật Allow access to file URLs, chốt Vercel Hobby project/domain và hoàn tất OAuth/recovery setup. Các việc kỹ thuật chưa xong được liệt kê rõ trong evidence; tiếp tục từ đó, không reset owner hoặc push migration root còn Today.

## Cập nhật tiếp tục P10/P11 — ưu tiên trạng thái này

**P06/P08 PASS local: browser CSV và ảnh đã kiểm chứng sau khi bật file URL.** P10 build/scoped lint/API/SQL/process/secret scan PASS; full lint vẫn baseline17/45, vòng browser release đầy đủ và rollback nghiệm thu chưa đóng. P11 migrations đã test trên DB rỗng local không Today; Vercel Hobby project vdq-admin đã tạo (Next.js/Node22), chưa Git/env/domain/deploy/cloud push. Recovery iCloud Passwords đang chờ user import CSV tạm, chưa xác minh cất key. Xem evidence/P10.md, evidence/P11.md cho thứ tự tiếp theo và cleanup. Không yêu cầu bật lại quyền Chrome hoặc tạo lại Vercel project.

### Recovery / Vercel — cập nhật cuối

User yêu cầu **bỏ qua import iCloud Keychain**. Đã hủy nhánh lưu key và xóa CSV tạm0600/thư mục/marker; key gốc vẫn ~/.config/dashboard-backup-recovery/private.pem, không có bằng chứng đã cất iCloud. Không tiếp tục nhắc unlock/import ở phiên sau trừ khi user yêu cầu. Vercel vdq-admin đã lưu duy nhất Function Region **Mumbai bom1** (success toast), Next.js/Node22/Hobby, chưa deploy.

## U11 — trạng thái thực thi mới nhất

- [x] P06/P08 browser uploads PASS, không cần cấu hình Chrome lại.
- [x] P10 PASS local; P11 cloud7 migrations không Today đã áp.
- [x] Vercel Hobby vdq-admin, vdq-admin.vercel.app, Next.js/Node22/bom1, sáu env Production đã lưu. Chưa deploy.
- [ ] Bạn tạo GitHub OAuth App production: homepage https://vdq-admin.vercel.app; callback https://wcgdvsiiemurehkprvqw.supabase.co/auth/v1/callback. Đặt Client ID/Secret kín trong Supabase Authentication → Providers → GitHub, không chat. Báo khi xong để hosted owner bootstrap/đóng signup/relogin.
- [ ] APP_OWNER_USER_ID cloud, production smoke/redeploy và hosted backup đầu tiên chưa hoàn tất.
- [ ] iCloud recovery copy chưa có; user yêu cầu bỏ qua bước import. CSV tạm đã xóa. Không yêu cầu thực hiện lại nếu chưa được user giao.

## Cập nhật 2026-10-21 — hosted owner đã hoạt động ở cấu hình

- User đã consent GitHub production. Callback owner_required trước bootstrap là fail-closed dự kiến. Verified identity provider_id/sub129001260 → cloud user f8960b75-231c-4096-b678-dc6dd619627e. Đã chạy bootstrap-owner-hosted.sql, enabled registry đúng một owner; APP_OWNER_USER_ID đã thêm chỉ Production. Không thay owner local.
- Signup cloud **đã đóng**, Email/manual linking/anonymous tắt; GitHub bật. Site URL/redirect production đúng. Live cloud preflight xác nhận signupDisabled=true, githubEnabled=true.
- Production **READY** https://vdq-admin.vercel.app ; owner-env redeploy https://vdq-admin-asmxl9xhc-bins-projects-c818da1e.vercel.app, deployment dpl_2hF9KdkbWshHZ5jb98gxvFjQfxcu. Redeploy log Ready2m. Đây là working-tree CLI deployment, không phải Git HEAD; không commit/push/Git auto-deploy.
- RLS/grants owner/non-owner hosted SQL transaction PASS; Notes non-owner insert/RPC denied,16tables RLS/anon grants, private bucket, Today absent. Anonymous production API401/private-no-store và page307. Logs P11-cloud-security/P11-production-anon-final.
- Hosted encrypted backup đầu tiên đã tạo trong ~/Documents/dashboard-backups/hosted,16tables rỗng/0images/7production migration variants; decrypt/owner/source scope PASS (P11-hosted-backup/verify.log). Adapter vẫn cần smoke **ảnh hosted thực và backup bytes** trước gate đầy đủ. Local drillP09 và isolated production schema tests đã có; chưa báo hosted media recovery PASS.
- **Blocker hiện tại: host trả Local browser use is disabled in Work settings.** User yêu cầu agent bật lại; app com.openai.codex bị Computer Use từ chối vì safety, không có tool cập nhật setting. Cần user tự bật Local browser use. Không dùng browser/runtime/cookie khác để bypass. Chưa verify owner relogin sau signup closure hoặc CRUD UI production/ảnh/redeploy persistence. **P11 PARTIAL, không PASS.**
- Recovery iCloud user bỏ qua, CSV đã xóa; key gốc ngoài Git giữ. Không hỏi lại import.
- Tiếp: bật browser → owner relogin → record smoke Notes/Calendar/Finance/check-in/Profile/preferences/goal image → backup ảnh/decrypt → redeploy persistence → cleanup exact smoke UUIDs → final backup và gate. Không chạy bootstrap/reset/reopen signup lại.

## U12 — cập nhật thực thi 21/10/2026

- User đã cho phép cài JDK/Android SDK và chấp nhận licenses; đã cài và build APK local thành công.
- User đã login stable mobile preview localhost5173; sau đó host báo local browser use disabled. Cần bật lại capability để tiếp tục UI QA, không nhập lại credentials qua file/cookie ngoài browser.
- User có Android và sẽ kết nối/cung cấp model/RAM/Android. ADB hiện chưa có thiết bị; chưa cài APK.
- Tên/appId development tạm dùng bin Dashboard / dev.vodinhquan.dashboard, logo hiện có; cần chốt trước bản ký phân phối.
- Chưa có quyền deploy/backend/cloud migration/OAuth redirect/signature config; chưa dùng release signing key. Chuẩn bị cụ thể trong [mobile runbook](../../mobile/README.md); không gửi key/password vào chat.
- [P12 evidence](evidence/P12.md): debug và unsigned release không thay thế nghiệm thu release trên máy thật.
