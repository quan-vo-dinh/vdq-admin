# Backend rollout — kế hoạch tinh gọn v2

## Ưu tiên cập nhật 21/10/2026 — P12 đã chọn Capacitor

[P12](phase-12-mobile-future.md) nay là kế hoạch chuyển **toàn bộ dashboard** sang web + APK Android bằng Capacitor, không còn nhánh PWA trước/TWA sau. Dùng chung UI/logic, giữ Next.js backend và Supabase, bổ sung mobile entry/static build, bearer auth, secure storage và adapters. Chưa triển khai mobile; xem 12A–12F và ma trận nghiệm thu trong tài liệu P12.

Web production đã hoạt động và có cả credentials từ env + GitHub. Tham chiếu [env login](../ENV_OWNER_LOGIN.md), [production login evidence](evidence/OWNER-ENV-LOGIN.md), [Profile/Finance backfill](evidence/PROFILE-FINANCE-BACKFILL.md), rồi evidence P11 để biết gate còn lại. Các đoạn “chưa deploy”, GitHub-only và số migration/env cũ bên dưới được giữ làm lịch sử, không dùng làm trạng thái hiện tại. Không tự đánh dấu toàn bộ P11 PASS từ các smoke gần đây.

Cập nhật 2026-10-20: **P00–P10 PASS local** theo evidence từng phase. Phiên tiếp tục đã đóng browser CSV P06 và ảnh private P08; P10 regression, OAuth owner relogin, desktop/mobile, process persistence và secret scan PASS. **P11 đã áp 7 migrations cloud không Today**, anon Data API denied; Vercel Hobby project `vdq-admin`, domain `vdq-admin.vercel.app`, Next.js/Node22/bom1 và sáu env Production đã tạo. **Chưa deploy/P11 chưa PASS**: chờ production GitHub OAuth/owner bootstrap, rồi hosted backup và smoke/redeploy. User yêu cầu bỏ qua lưu key vào iCloud; CSV tạm đã xóa, key gốc ngoài Git giữ nguyên. Xem [P10](evidence/P10.md), [P11](evidence/P11.md), [bàn giao](HANDOFF.md).

## Phạm vi giữ nguyên

- Một owner GitHub-only, sử dụng hằng ngày; Supabase Free PostgreSQL/Auth/Storage + Next.js API trên Vercel Hobby.
- Notes, Calendar, Finance, Learning, personal Profile/Preferences và ảnh goal hiện có sẽ lưu thật; tái sử dụng UI/SWR/Context.
- Blog, Developer Workspace, social profile, ticket template cũ và KPI demo ngoài scope: giữ source/mock, không xây backend.
- User đã xác nhận dữ liệu hiện tại trong scope đều mock: production rỗng. Không importer/mapping/demo snapshot mới; nếu phát sinh dữ liệu thật trước cutover thì kiểm tra lại đúng dataset đó.
- Chưa ORM/backend riêng/Redis/Realtime/đa user/multi-currency/native sync. Không paid add-on, không tự thay region/project.

## Đính chính phạm vi — 2026-10-20

User xác nhận **không có trang Today**. Route `/today` và mục sidebar đã xóa.
P04 chỉ yêu cầu Notes; P05 chỉ yêu cầu Calendar/settings và các view hiện có của Calendar.
Không tạo trang thay thế hoặc di chuyển các widget Today sang Developer/trang khác.
Today priorities, Quick Note, Recent Notes và Activity kiểu Today đã loại khỏi scope release;
không xây backend bổ sung, đồng bộ, backup/restore, QA, deploy hoặc mobile flow cho module này.
P06–P08 chỉ Finance/Learning/Profile/Preferences/ảnh goal; P09–P12 chỉ vận hành các module đã chấp nhận.
Source/API/schema Today local là phần dư từ diễn giải trước; giữ để bảo toàn lịch sử, không tự khôi phục UI
hoặc coi đó là scope production. Trước P11 phải rà/tách migration chưa áp trên cloud để không triển khai
Today chỉ vì nó nằm trong migration local gộp. P00/P01 và log/ảnh cũ là lịch sử, không là yêu cầu hiện tại.

## Hạ tầng đã có — dùng lại P01

Theo evidence P01: dasboard-vodinhquan, ref wcgdvsiiemurehkprvqw, URL https://wcgdvsiiemurehkprvqw.supabase.co, Free/Mumbai ap-south-1. Data API ON, auto-expose OFF, automatic RLS trigger enabled. Chưa business migrations; cloud default grants còn cần xử lý theo SQL app trước public.

Local CLI/config/env/check/reset/typegen/smoke và schema dump/restore đã kiểm chứng; xem [local runbook](LOCAL_DEVELOPMENT.md). Workspace đã linked cloud qua ignored .temp, local chỉ dùng wrapper/--local rõ ràng. Không đọc/copy secret hoặc quay lại cloud UI xác minh toàn bộ ở mỗi phase.

Evidence P00/P01 là lịch sử, giữ nguyên. Bộ phase v2 là chỉ dẫn tiếp theo; không làm lại P00/P01 chỉ vì câu chữ phase cũ khác v2.

## Lộ trình và đầu ra dùng được

| Phase | Đầu ra chính | Phụ thuộc |
| --- | --- | --- |
| [P00](phase-00-inventory-preservation.md) | Inventory/bảo toàn — đã PASS | — |
| [P01](phase-01-supabase-environments.md) | Môi trường/tooling — đã PASS | P00 |
| [P02](phase-02-schema-security-contracts.md) | Một foundation owner/RLS nhỏ | P01 |
| [P03](phase-03-github-owner-auth.md) | **GitHub login chạy, UI cũ, API được bảo vệ** | P02 |
| [P04](phase-04-notes.md) | **Notes lưu thật, reload còn** | P03 |
| [P05](phase-05-today-calendar.md) | Calendar và settings lưu thật | P04 |
| [P06](phase-06-finance.md) | Finance; chia 6A CRUD và 6B CSV/báo cáo nếu cần | P05 |
| [P07](phase-07-learning.md) | Habits/check-ins/streak lưu thật | P06 |
| [P08](phase-08-profile-preferences-storage.md) | Profile/preferences và ảnh goal private | P07 |
| [P09](phase-09-backup-operations.md) | Một workflow backup/restore đã thử | P08 |
| [P10](phase-10-integration-release-qa.md) | Một vòng QA release | P09 |
| [P11](phase-11-production-deployment.md) | **Web/backend production dùng được** | P10 |
| [P12](phase-12-mobile-future.md) | **Toàn bộ Web + APK Android, Capacitor; plan đã cập nhật, chưa triển khai** | Backend P11 hiện có; giữ gate nghiệm thu P11 riêng |

Không gộp mọi phase cho một phiên. P06/P07 đã được triển khai trong phiên user giao cả hai phase. Phiên user giao P08/P09 đã triển khai cả hai, làm các phần P09 độc lập trong khi P08 chờ quyền browser upload. Còn gate browser P06/P08; kế tiếp P10.

## Nguyên tắc thực thi v2

1. Đọc HANDOFF + đúng phase đang giao + user setup liên quan; xem evidence chi tiết chỉ khi cần. Không đọc lại mọi phase, toàn repo và mọi log chỉ để bắt đầu.
2. Tái sử dụng công cụ đã PASS. Không tạo wrapper, validator env, snapshot/receipt, manifest hoặc harness mới nếu thứ đã có đáp ứng. Không cài lại dependencies/đổi version vì thói quen.
3. Ưu tiên một luồng UI → API → DB hoạt động. Module đơn giản có thể một file server/domain và route adapter; không bắt đủ service/repository/factory/schema folders.
4. RLS + explicit grants vẫn bắt buộc, không admin key trong request CRUD. CRUD một row dùng supabase-js/query filters; RPC chỉ khi transaction/invariant thực sự cần. Không generic command bus/ledger request đa module.
5. API update/delete dùng revision kiểm tra nguyên tử, 409 giữ draft; UUID create ổn định cho retry. RLS bảo vệ identity, không hứa CAS cưỡng chế cho owner tự thao tác Data API ngoài app.
6. Phần tiền/timezone/check-in phải đúng nhưng kiểm thử ở domain tương ứng; P02 không test Finance/Notes chưa xây. Không dựng framework giả định tải lớn để chuẩn bị tương lai.
7. Kiểm thử thay đổi đúng một vòng: module/SQL tests liên quan, browser luồng chính khi đổi UI, lint theo repo và build cuối khi frontend/shared TS bị ảnh hưởng. Chỉ rerun khi code mới, lỗi hoặc concern chưa giải quyết yêu cầu. Không full baseline/restore/benchmark ở mỗi phase.
8. P10 tổng hợp regression cuối; P09 restore một lần đủ data/ảnh/owner; P11 smoke môi trường thật và backup đầu tiên, không lặp toàn bộ drill nếu không có khác biệt ảnh hưởng.
9. Evidence mỗi phase một file Markdown ngắn: đã đổi, lệnh/kết quả, lỗi/blocker, user action và bước sau. Ảnh/log chỉ khi có ích hoặc cần điều tra; không tạo bộ receipt/checksum riêng cho từng thao tác.
10. Nếu setup lỗi cùng nguyên nhân qua hai lần thử có mục tiêu mà chưa tiến triển, ghi blocker/nhu cầu user, chuyển phần độc lập; không retry vòng lặp hoặc mở rộng tooling vô hạn. Không báo PASS khi còn thiếu kiểm chứng bắt buộc.
11. Không cần giờ chạy cố định/ước lượng hứa hẹn; cập nhật ngắn khi tác vụ kéo dài, nêu đầu ra thực tế. Không dùng hết timebox để đánh dấu hoàn thành.
12. Giữ thay đổi ngoài phạm vi và P00/P01 đã có. Không reset/reformat, commit/push/deploy trái phạm vi user giao. Hạ tầng cloud mutation chỉ khi tới phase thực thi được giao, không trong lượt sửa plan.

## Kiểm tra không cắt giảm

- Verify session + đúng owner tại server, RLS/grants chặn anon/non-owner, private data không public-cache, secret không vào bundle.
- Save thành công là DB commit, reload/restart/redeploy không mất; lỗi giữ draft, không fallback mock trong module đã migrate.
- Calendar ngày/giờ VN, Finance tiền/transfer/refund/import atomic, Learning unique check-in và archive rules.
- Trước dùng production thật: backup data + ảnh, khôi phục được, user biết lịch backup; không giả định Free tự backup.
- Không public arbitrary-file /api/code hoặc bỏ hở API ngoài scope vì hoãn tính năng.

## Hoãn có chủ đích

Global idempotency ledger, tất cả CRUD qua RPC, SQL validator Tiptap trùng JS, tiền BigInt framework từ P02, importer demo, media asset FSM, CI/CD pipeline, hosted backup scheduler/alert engine, stress benchmark và native/offline adapters.

Hoãn không có nghĩa bỏ tính năng người dùng đã có: Notes Save, Finance CSV/goal image, Calendar, Learning và Profile đều phải hoàn tất trước P11. Nếu user cần automated backup hoặc quy mô vượt mức hiện tại thì bổ sung công việc có mục tiêu, không làm trước vô điều kiện.

## Tài liệu đồng bộ

- [User setup](USER_SETUP.md), [HANDOFF](HANDOFF.md), [thiết kế tổng thể v2](../PERSONAL_BACKEND_DATABASE_PLAN.md).
- Ưu tiên chỉ dẫn: yêu cầu user mới nhất → README/phase v2 → tài liệu tổng thể; evidence là kết quả lịch sử, không ép làm lại các yêu cầu đã hoãn.
- Local runbook/P00/P01 giữ nguyên công cụ và trạng thái. Token/dump/key không vào Git/chat.

## Nguồn kỹ thuật

[Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [update filters](https://supabase.com/docs/reference/javascript/update), [functions](https://supabase.com/docs/guides/database/functions), [Next SSR](https://supabase.com/docs/guides/auth/server-side/nextjs), [backup](https://supabase.com/docs/guides/platform/backups). Khi thực thi, chỉ tra phần cần cho API/SDK đang dùng; không biến mỗi phiên thành nghiên cứu lại stack.

## Phiên P10/P11 — 2026-10-20

Đã chạy regression và chuẩn bị migration production riêng; **P10/P11 chưa PASS, chưa cloud push/deploy**. Xem [P10 evidence](evidence/P10.md) và [P11 evidence](evidence/P11.md) cho kết quả mới nhất, ưu tiên hơn trạng thái bàn giao cũ. Build PASS, lint giữ nguyên baseline 17/45, SQL 105/105, API Finance/Learning/personal PASS. Browser file upload vẫn bị quyền Chrome chặn khi thử thực tế. User cần bật Allow access to file URLs, chốt Vercel Hobby project/domain và hoàn tất OAuth/recovery setup. Các việc kỹ thuật chưa xong được liệt kê rõ trong evidence; tiếp tục từ đó, không reset owner hoặc push migration root còn Today.

## Cập nhật tiếp tục P10/P11 — ưu tiên trạng thái này

**P06/P08 PASS local: browser CSV và ảnh đã kiểm chứng sau khi bật file URL.** P10 build/scoped lint/API/SQL/process/secret scan PASS; full lint vẫn baseline17/45, vòng browser release đầy đủ và rollback nghiệm thu chưa đóng. P11 migrations đã test trên DB rỗng local không Today; Vercel Hobby project vdq-admin đã tạo (Next.js/Node22), chưa Git/env/domain/deploy/cloud push. Recovery iCloud Passwords đang chờ user import CSV tạm, chưa xác minh cất key. Xem evidence/P10.md, evidence/P11.md cho thứ tự tiếp theo và cleanup. Không yêu cầu bật lại quyền Chrome hoặc tạo lại Vercel project.

## Tiến độ P12 thực thi 21/10/2026

P12 chuyển từ planned sang **IN PROGRESS**: đã triển khai shared adapters/mobile entry/full route map, native project/auth và build APK debug + release chưa ký. [Evidence P12](evidence/P12.md) ghi kết quả local và gate còn thiếu; chưa đạt full parity/native performance/release acceptance, không tự đóng P11. [Lệnh chạy và rollback](../../mobile/README.md).
