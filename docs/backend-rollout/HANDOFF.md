# Bàn giao mới nhất P10/P11 — 2026-10-20

## Chỉ dẫn tiếp theo cập nhật 21/10/2026

User yêu cầu cập nhật kế hoạch theo **Capacitor cho toàn bộ dashboard Web + APK Android**. Đọc [P12 mới](phase-12-mobile-future.md), [README](README.md) và [U12](USER_SETUP.md#u12--web--android-capacitor). Đã cập nhật tài liệu; chưa cài Capacitor/SDK, chưa tạo Android project/signing key/APK và chưa chạy mobile acceptance. Không coi việc user giao viết plan là yêu cầu triển khai/deploy ngay.

Hướng đã chốt: giữ web/API Next.js + Supabase, shared feature UI/logic và mobile React static entry riêng; platform adapters, mobile owner session/secure storage, full route matrix, thiết bị thật và release/rollback. Không làm lại quyết định thành PWA/TWA hoặc kết thúc bằng một flow Finance.

Production đã deploy; auth credentials từ env đã chạy cùng GitHub, Profile save/Finance backfill đã có evidence bổ sung. Xem [owner login](evidence/OWNER-ENV-LOGIN.md), [Profile/Finance](evidence/PROFILE-FINANCE-BACKFILL.md) và evidence P11. Các trạng thái “chưa deploy”, “P10–P12 chưa triển khai” phía dưới là lịch sử; P12 hiện **planned**, P11 không tự chuyển PASS.

**P10 PASS local. P11 PARTIAL, đã có cloud migrations; chưa deploy.** Phần P08/P09 và trạng thái PARTIAL cũ bên dưới là lịch sử.

1. Không tạo lại Vercel hoặc bật lại quyền Chrome: project https://vercel.com/bins-projects-c818da1e/vdq-admin, ID prj_42afjCgU71NWGZY0NIISVDKSNcwR; domain vdq-admin.vercel.app (No Deployment), Next.js/Node22/bom1. Sáu env Production đã lưu; còn APP_OWNER_USER_ID cloud. Preview/Development không có app DB env.
2. Cloud ref wcgdvsiiemurehkprvqw đã áp00100/00400/00500/00600/00700/00710/00800 từ workdir **/tmp/dashboard-production-release**, không Today. Không push lại migration root hoặc repair/reset. Dùng script prepare-production.mjs để tái dựng variant nếu mất workdir; không sửa local history. Owner chưa bootstrap; không dùng UUID local cho env cloud.
3. Chờ user tạo production OAuth App, callback https://wcgdvsiiemurehkprvqw.supabase.co/auth/v1/callback, homepage https://vdq-admin.vercel.app và đặt ID/Secret kín trong Supabase GitHub provider. Preflight cuối githubEnabled=false/signupDisabled=false. Không deploy public app trước khi bootstrap owner verified129001260, bind env và đóng signup/providers thừa. Consent/secret cần user.
4. Hoàn tất hosted backup adapter với target explicit và production variant SQL, không chạy tool backup P09 local rồi gọi là cloud. Sau bootstrap/deploy smoke lưu/redeploy/private ảnh + first hosted encrypted bundle. Không seed demo. P09 local drill còn hiệu lực; khác biệt variant migrations phải được đối chiếu khi restore.
5. User đã yêu cầu **bỏ qua cất iCloud key**. CSV tạm đã xóa; không tiếp tục hỏi import/unlock. Key gốc ~/.config/dashboard-backup-recovery/private.pem0600 vẫn giữ, không xác nhận có recovery copy trong password manager.
6. Dev3000 + Supabase source giữ nguyên; test Next3100 đã stop riêng. QA DB cô lập p11_release_migrations, p11_release_qa/qa2/qa3 trong container source giữ để kiểm tra; không phải source postgres. Browser QA tabs đã đóng, Vercel settings handoff giữ. Exact fixture cleanup trong P10-cleanup.log; Notes/account/transaction có trước giữ nguyên.
7. Evidence mới nhất P10.md/P11.md; các gate/restrictions “chưa cloud mutation” phía dưới đã được yêu cầu thực thi P10/P11 mới hơn thay thế. Không commit/push/stage/reset nào từ agent.

---

# Bàn giao P08/P09 — 2026-10-20

**P08 triển khai local; còn gate browser upload do quyền Chrome. P09 PASS local backup/restore.**
[P08 evidence](evidence/P08.md), [P09 evidence](evidence/P09.md), [backup runbook](BACKUP_RESTORE.md),
[user setup](USER_SETUP.md). P00–P05/P07 PASS theo evidence cũ; P06 còn gate browser CSV.
Không cloud migration/deploy, không commit/push/reset DB từ agent. P10–P12 chưa triển khai.

## Bắt đầu phiên tiếp

1. Đọc README → evidence P08/P09 → USER_SETUP U06/U08/U09.
2. User đã chọn **“Tôi sẽ bật sau; ghi browser upload là gate còn mở”**.
   Khi có quyền Chrome `chrome://extensions` → ChatGPT → Details → Allow access to file URLs:
   - P08: `/finance/goals`, tạo/sửa goal, chọn JPG/PNG/WebP <=2MiB → Save → reload, desktop/mobile.
     Chứng minh ảnh hiển thị từ signed private Storage, lỗi giữ draft/ảnh cũ. Chưa báo P08 full PASS.
   - P06: CSV quoted/CRLF/BOM hai dòng giống nhau, preview/import/reload; invalid row chặn import.
     Không lặp toàn bộ API/SQL Finance đã PASS.
3. Đóng gates P06/P08 rồi P10 regression. Không deploy/P11 hoặc mở lại signup/bootstrap source.
4. **User cần cất private recovery key** `~/.config/dashboard-backup-recovery/private.pem` riêng trong password manager;
   user đã chọn nơi backup `~/Documents/dashboard-backups`, manual hằng ngày. Public `.pub` dùng chạy backup.
5. P11 phải nối/test nguồn hosted backup trước dữ liệu production: tool P09 cố định local, không dùng linked cloud
   mặc định. Cloud Auth/OAuth/Vercel/domain/env vẫn U11. Không cần repeat drill khi không có khác biệt ảnh hưởng.

## Hiện trạng P08

- profiles/user_preferences + migration 00800 đã áp local và typegen; RLS/grants owner, JSON whitelist,
  CAS Profile/address; server locale/theme. finance_settings.starts_on giữ nguồn duy nhất, timezone VN.
- PersonalProvider SWR trong dashboard shell; header/Profile chung data. Save await DB, conflict giữ draft,
  server preferences hydrate, chỉ explicit header actions PATCH, focus/interval sync tab khác.
- personal-media private 2MiB JPEG/PNG/WebP; `/api/finance/goals/image?id=UUID&revision=N` GET/POST/DELETE,
  bounded raw body, Sharp decode/re-encode WebP, random immutable path owner/goals/UUID.webp.
  Upload → CAS attach → xóa ảnh cũ; attach fail dọn ảnh mới; cleanup fail log path. `media-cleanup.mjs` dry-run.
- image_path nullable prefix-checked, không base64/signed URL DB; signed 120s refresh UI 90s/focus.
  Goal field save/image attach hai commit; lỗi ảnh nói rõ field đã lưu, giữ draft/revision retry.
- Avatar/static metadata giữ nguyên, không uploader Notes/avatar/social backend.

## P09 và kiểm chứng

- 16 business tables, exact numeric text, owner mapping, migrations/version + referenced image bytes trong encrypted
  bundle ngoài repo. SHARE locks snapshot DB/Storage, atomic output0600, giữ 3 bản sau backup thành công.
- Restore script chỉ target `/tmp/dashboard-p09-drill`, API55321, DB/Storage riêng; guard empty/migration bytes/
  verified GitHub ID, remap owner/singleton IDs/ảnh prefix. Transaction import, counts/money/date/media checksum/RLS PASS.
- Target fixture synthetic GitHub identity để kiểm recovery mapping/app owner verifier, không consent OAuth thật lần hai.
  Source Auth registry/session/signup giữ nguyên. Scratch app copy chỉ đổi ports/origin validator ngoài repo;
  không nới runtime env guard hoặc thêm login route vào source.
- Browser Notes/goal image target đã thấy thực tế. Final source backup đã decrypt/manifest PASS, sau cleanup;
  xem file/UTC time/counts trong `evidence/P09-backup.log`. Bundle drill có 1 ảnh cũng nằm encrypted ngoài Git.
- P08 API PASS gồm actual expiry122s, URL refresh, two concurrent upload200/409, MIME/fake/size/prefix,
  anonymous/CAS/profile identity. SQL mới9/9, tool unit3/3, scoped lint sạch, build PASS.
  Full lint cuối17 errors/45 warnings ngoài scope. Browser Profile/address/header/reload/tab khác/EN-dark PASS,
  mobile390×844 không overflow; private image API-upload→browser-read PASS. Filechooser upload chưa PASS.

## Bảo toàn / kết thúc

- Chỉ dọn UUID/image fixtures do phiên này tạo; personal QA P08/Browser/address markers trở về rỗng,
  locale/theme về vi/light ban đầu bằng CAS. Notes user, account/CSV transaction từ P06 và import batch giữ nguyên.
- Source original Next :3000 + Supabase local :54321 vẫn chạy. Target test :3102 và Supabase dashboard-p09-drill
  đã stop riêng; volumes target giữ để điều tra, không phải source data. Scratch session route/env đã gỡ.
  Browser QA tabs do phiên tạo đã đóng; tab user đang dùng giữ nguyên.
- User/phiên khác có staging thay đổi trong lúc chạy. Agent không stage/unstage/reset/commit/revert thay đổi này.
  Phần diff P08 gồm Profile/goal files vốn có sửa từ trước; đã chỉnh có mục tiêu, giữ dialog size/layout trước đó.
- **Today không có trang/scope**: không khôi phục UI, không backup data Today. Migrations local00400/00500 còn
  schema/function lịch sử; P11 tách trước khi cloud push. Không coi migration bundle local là scope production.

## Phiên P10/P11 — 2026-10-20

Đã chạy regression và chuẩn bị migration production riêng; **P10/P11 chưa PASS, chưa cloud push/deploy**. Xem [P10 evidence](evidence/P10.md) và [P11 evidence](evidence/P11.md) cho kết quả mới nhất, ưu tiên hơn trạng thái bàn giao cũ. Build PASS, lint giữ nguyên baseline 17/45, SQL 105/105, API Finance/Learning/personal PASS. Browser file upload vẫn bị quyền Chrome chặn khi thử thực tế. User cần bật Allow access to file URLs, chốt Vercel Hobby project/domain và hoàn tất OAuth/recovery setup. Các việc kỹ thuật chưa xong được liệt kê rõ trong evidence; tiếp tục từ đó, không reset owner hoặc push migration root còn Today.

## Cập nhật tiếp tục P10/P11 — ưu tiên trạng thái này

**P06/P08 PASS local: browser CSV và ảnh đã kiểm chứng sau khi bật file URL.** P10 build/scoped lint/API/SQL/process/secret scan PASS; full lint vẫn baseline17/45, vòng browser release đầy đủ và rollback nghiệm thu chưa đóng. P11 migrations đã test trên DB rỗng local không Today; Vercel Hobby project vdq-admin đã tạo (Next.js/Node22), chưa Git/env/domain/deploy/cloud push. Recovery iCloud Passwords đang chờ user import CSV tạm, chưa xác minh cất key. Xem evidence/P10.md, evidence/P11.md cho thứ tự tiếp theo và cleanup. Không yêu cầu bật lại quyền Chrome hoặc tạo lại Vercel project.

### Recovery / Vercel — cập nhật cuối

User yêu cầu **bỏ qua import iCloud Keychain**. Đã hủy nhánh lưu key và xóa CSV tạm0600/thư mục/marker; key gốc vẫn ~/.config/dashboard-backup-recovery/private.pem, không có bằng chứng đã cất iCloud. Không tiếp tục nhắc unlock/import ở phiên sau trừ khi user yêu cầu. Vercel vdq-admin đã lưu duy nhất Function Region **Mumbai bom1** (success toast), Next.js/Node22/Hobby, chưa deploy.

## Cập nhật 2026-10-21 — hosted owner đã hoạt động ở cấu hình

- User đã consent GitHub production. Callback owner_required trước bootstrap là fail-closed dự kiến. Verified identity provider_id/sub129001260 → cloud user f8960b75-231c-4096-b678-dc6dd619627e. Đã chạy bootstrap-owner-hosted.sql, enabled registry đúng một owner; APP_OWNER_USER_ID đã thêm chỉ Production. Không thay owner local.
- Signup cloud **đã đóng**, Email/manual linking/anonymous tắt; GitHub bật. Site URL/redirect production đúng. Live cloud preflight xác nhận signupDisabled=true, githubEnabled=true.
- Production **READY** https://vdq-admin.vercel.app ; owner-env redeploy https://vdq-admin-asmxl9xhc-bins-projects-c818da1e.vercel.app, deployment dpl_2hF9KdkbWshHZ5jb98gxvFjQfxcu. Redeploy log Ready2m. Đây là working-tree CLI deployment, không phải Git HEAD; không commit/push/Git auto-deploy.
- RLS/grants owner/non-owner hosted SQL transaction PASS; Notes non-owner insert/RPC denied,16tables RLS/anon grants, private bucket, Today absent. Anonymous production API401/private-no-store và page307. Logs P11-cloud-security/P11-production-anon-final.
- Hosted encrypted backup đầu tiên đã tạo trong ~/Documents/dashboard-backups/hosted,16tables rỗng/0images/7production migration variants; decrypt/owner/source scope PASS (P11-hosted-backup/verify.log). Adapter vẫn cần smoke **ảnh hosted thực và backup bytes** trước gate đầy đủ. Local drillP09 và isolated production schema tests đã có; chưa báo hosted media recovery PASS.
- **Blocker hiện tại: host trả Local browser use is disabled in Work settings.** User yêu cầu agent bật lại; app com.openai.codex bị Computer Use từ chối vì safety, không có tool cập nhật setting. Cần user tự bật Local browser use. Không dùng browser/runtime/cookie khác để bypass. Chưa verify owner relogin sau signup closure hoặc CRUD UI production/ảnh/redeploy persistence. **P11 PARTIAL, không PASS.**
- Recovery iCloud user bỏ qua, CSV đã xóa; key gốc ngoài Git giữ. Không hỏi lại import.
- Tiếp: bật browser → owner relogin → record smoke Notes/Calendar/Finance/check-in/Profile/preferences/goal image → backup ảnh/decrypt → redeploy persistence → cleanup exact smoke UUIDs → final backup và gate. Không chạy bootstrap/reset/reopen signup lại.


## 2026-10-21 — sửa production feature gate Developer/Blog/feed

- User chốt chỉ giữ demo trong Developer workspace và Blog; feed là tích hợp daily.dev thật. Nguyên nhân 403: withOwner chặn toàn bộ prefix /api/developer, bao gồm /api/developer/feed.
- Đổi sang checkHostedFeature: sau verify owner, chỉ GET/HEAD chính xác /api/developer, /api/developer/feed, /api/blog được phép; legacy Today/ticket/userprofile, unknown child routes và writes demo vẫn denied. Không đổi schema, owner hoặc dữ liệu nghiệp vụ.
- Production trước đó thiếu DAILY_DEV_TOKEN và DAILY_DEV_FEED_ENABLED. Token local hiện hữu gọi upstream200; đã lưu kín vào Vercel Secret chỉ Production và bật flag. Không log/copy secret vào repo.
- Deploy CLI working tree thành công, không Git commit/push: dpl_evpBL2M4hvponhr9stNw3Vu3qVuQ; https://vdq-admin-qxn7xxjn7-bins-projects-c818da1e.vercel.app ; alias https://vdq-admin.vercel.app .
- Verify: auth-policy4/4, developer-feed suite PASS, scoped ESLint PASS, build PASS, git diff --check PASS. Full lint giữ baseline17errors/45warnings. Logs ngoài repo /tmp/vdq-feed-fix-{build,lint,deploy}.log.
- Browser đã truy cập được trở lại qua host Chrome: owner feed daily.dev hiển thị10bài/thời điểm cập nhật21/10/2026, Developer overview không còn fallback warning, Blog list hiện bài demo. Screenshot P11-feed-production-fix.png. Anonymous cả3API401, private/no-store. Không đọc/export cookie/token browser.
- Browser blocker cũ đã hết cho kiểm tra này. P11 tổng thể vẫn cần smoke CRUD/media/backup ảnh/redeploy persistence theo checklist cũ; không đánh dấu toàn bộ PASS từ lần sửa này. Feed vẫn còn tùy chọn demo rõ ràng có sẵn trong UI; lần này không sửa UI/nguồn dữ liệu ngoài policy/config.


## 2026-10-21 — Git là nguồn triển khai chuẩn

User đã yêu cầu đồng bộ bản sửa lên GitHub và thiết lập luồng Git/Preview/Production. Vercel project vdq-admin đã kết nối repository quan-vo-dinh/vdq-admin bằng `vercel git connect`; không tạo project/domain mới. `vercel.json` chạy auth-policy tests → daily.dev service tests → Next build; một bước thất bại sẽ ngăn deployment mới. `.vercelignore` chỉ mở lại hai test scripts cần cho build, giữ tooling còn lại bị loại khỏi upload CLI.

Luồng: nhánh codex/* → push/PR → Preview build → kiểm tra → merge main → Vercel tự production deployment. Không deploy working tree bằng CLI trong luồng thường lệ. Preview không được copy env/credentials production; backend phải fail closed khi chưa có môi trường test riêng. Full lint hiện baseline17errors/45warnings, không đưa full lint đang đỏ thành gate giả định PASS. Không chạy migrations/seed/bootstrap từ build hoặc Git push.

## P12 thực thi — 21/10/2026 (ưu tiên hơn trạng thái planned ở trên)

Đã có mobile React/Vite entry dùng chung views/adapters, Capacitor8 Android project, owner bearer xuyên repository/RLS, secure vault native, credentials/PKCE flow và scripts/build. Web/mobile typecheck/build và Android debug/unsigned release PASS local. **P12 IN PROGRESS, chưa PASS**: browser hiện bị host disable; CSV/full module UI, thiết bị thật, OAuth native, performance, signed release/cloud rollout chưa nghiệm thu. Không deploy/commit/push/cloud migrate. Xem [P12 evidence](evidence/P12.md) và [mobile runbook](../../mobile/README.md). User đã tự login preview localhost5173 và sẽ kết nối Android. Không import cookie/JWT tự ký để vượt gate.
