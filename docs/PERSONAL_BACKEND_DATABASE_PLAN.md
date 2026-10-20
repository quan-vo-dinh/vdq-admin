# Thiết kế backend/database cá nhân — v2

Cập nhật 2026-10-20 theo yêu cầu giảm thời gian và tránh làm quá mức. [Bộ phase](backend-rollout/README.md) là kế hoạch thực thi; [HANDOFF](backend-rollout/HANDOFF.md) ghi kết quả P00/P01 đã hoàn thành. P02/P03 đã PASS local, gồm OAuth GitHub cá nhân thật, registry bootstrap và đóng signup. P04 Notes và P05 Calendar đã triển khai local; xem evidence/bàn giao hiện tại.

## Quyết định đã chốt

- Supabase Free PostgreSQL/Auth, Storage private cho ảnh goal; Next.js Route Handlers giữ backend, Vercel Hobby deploy.
- Một GitHub owner duy nhất, reuse login UI hiện có. Không username/password hoặc multi-role.
- Notes, Calendar, Finance, Learning, personal Profile/Preferences trong scope; Blog/Developer/social/ticket template ngoài scope, giữ source/mock.
- User xác nhận dữ liệu hiện tại đều mock, production bắt đầu rỗng; không xây import/mapping demo.
- Tái sử dụng local tooling P01; không ORM/service backend riêng/Realtime/queue. Project đã có Mumbai wcgdvsiiemurehkprvqw giữ nguyên.

## Đính chính phạm vi Today

User xác nhận không có trang Today; route `/today` và menu đã xóa. Không tạo trang thay thế,
Quick Note/priorities/Activity đã loại khỏi release, kể cả backend bổ sung, backup/restore,
QA, production smoke, sync/mobile và start URL/deep link. Source/API/bảng Today local từ diễn giải trước
được giữ nguyên trong lượt xóa trang, không coi là schema production bắt buộc. P11 phải rà/tách phần Today
khỏi migration cloud trước khi áp dụng. Evidence/snapshot cũ chỉ ghi lịch sử, không tự khôi phục scope này.

## Kiến trúc đủ dùng

UI → SWR/Context → Next API (verify owner, validate input) → module server/domain → Supabase bằng JWT user → PostgreSQL/RLS.

Một module đơn giản không bắt buộc bốn lớp service/repository/schema/factory. RLS và grants nằm cùng SQL migration; generated types dùng script sẵn. Nhiều bước cần atomic mới dùng PostgreSQL RPC, không mọi CRUD.

## Schema theo phase

| Phase | Bảng/quan hệ chính |
| --- | --- |
| P02 | private.app_owner singleton, helper owner gate; không global mutation ledger |
| P04 | notes: owner, title, Tiptap JSONB, color, note_at, timestamps/revision |
| P05 | calendar_events timed/all-day; calendar_settings 1:1 owner |
| P06 | finance_accounts/categories/transactions/budgets/budget_months/goals/bills; import_batches và batch-row fields trên transactions |
| P07 | learning_habits/checkins; UNIQUE(owner,habit,day) |
| P08 | profiles và user_preferences 1:1 owner; goal.image_path và bucket private, không media FSM |

UUID business entity, owner từ verified identity; FKs cùng owner; DATE cho ngày nghiệp vụ, timestamptz cho instant. Revision đơn giản tăng do DB cho mutation app, không cần bigint-string protocol toàn cục ngay từ foundation.

Tiền VND nguyên numeric(18,0), SQL read text trước JSON, Number adapter kiểm tra safe range khi UI/chart cần. Totals đúng trên toàn khoảng dữ liệu; chi tiết tiền chỉ xây/test ở P06.

## Bất biến cần giữ

- Owner-only tại page/API và RLS, registry private. Không first-user-wins/public bootstrap, không admin key trong CRUD.
- CRUD update/delete lọc expectedRevision nguyên tử để tránh app/tab khác ghi đè. Owner gọi Data API trực tiếp vẫn là quyền của chính owner; không quảng cáo RLS là cơ chế bắt revision.
- Tiptap dùng server validator hiện có và safe rendering, DB shape/size checks; không viết duplicate document sanitizer bằng SQL.
- Calendar giờ Việt Nam, timed UTC và all-day date end-exclusive; query overlap đúng.
- Finance transfer/refund/goal earmark/bills dự kiến giữ semantics hiện tại; CSV transaction nguyên tử và batch retry-safe, không global fingerprint dedupe.
- Learning một check-in/ngày, archived không check-in và undo có conflict check; không counter streak dư thừa.
- Storage private/prefix/size/MIME, server kiểm tra bytes trước attach, upload fail giữ ảnh cũ; cleanup nhỏ, chưa worker.
- DB lỗi không fallback demo/saved giả; private responses no-store; API ngoài scope vẫn phải gate trước public.

## Kiểm thử và vận hành theo thời điểm

- P02: foundation/grants/RLS tests nhỏ.
- P03: auth local thật, fake/non-owner/callback/Origin/cache, reuse UI.
- P04–P08: tests đúng domain + một vòng browser luồng chính, lint/build khi đổi frontend; không chạy lại baseline/restore cho mỗi phase.
- P09: backup một lệnh, encrypted data+file objects và owner recovery, thử restore một lần. Manual workflow được chấp nhận nếu user biết phải chạy; không hứa RPO khi chưa có runner.
- P10: regression/release build tổng hợp, tham chiếu kết quả còn áp dụng.
- P11: migration production + owner bootstrap + smoke/redeploy + backup đầu tiên. Không importer mock/freeze pipeline khi production vẫn rỗng.
- P12 tương lai chỉ chọn PWA rồi APK nếu cần; native/offline-first là công việc riêng.

## Những yêu cầu cũ đã bỏ khỏi đường triển khai bắt buộc

Không private.mutation_requests, SQL Tiptap parity validator, custom RPC cho mọi CRUD, media_assets FSM, importer dữ liệu demo, full CI/CD trước release, hosted backup scheduler hoặc nhiều receipt mỗi bước. Không bỏ quyền truy cập, tính đúng dữ liệu, backup/restore cần thiết hay tính năng UI đã cam kết.

[Checklist user setup](backend-rollout/USER_SETUP.md) giữ những việc thực sự cần tài khoản/secret/consent, chia đúng phase. Tài liệu AUTH_OWNER_DATABASE_BACKEND_PLAN.md cũ chỉ là lịch sử, không triển khai Credentials/Blog từ đó.
