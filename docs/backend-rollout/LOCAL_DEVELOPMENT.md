# Local Supabase — P01

> Cập nhật sau P02/P03: P02/P03 PASS local: foundation/owner đã bind, GitHub bật và signup đóng. Start script tự nạp secret env local được ignore; không bootstrap/reset lại registry thật. Đọc [HANDOFF](HANDOFF.md) và [U03](USER_SETUP.md#u03--p03-github-oauth-và-owner) trước bootstrap. Các mô tả trạng thái P01 bên dưới là lịch sử; không reset hoặc chạy lại toàn bộ smoke/dump/restore để tiếp tục.

Dùng Node **22.23.2** (`.nvmrc`), pnpm **11.22.0** (`packageManager`, khớp node_modules đang có), Supabase CLI **2.121.0** (exact devDependency + lockfile), Docker API tương thích. Phiên triển khai ban đầu PATH có pnpm 10.32.1 nhưng node_modules dùng store v11; dùng `npx --yes pnpm@11.22.0` để thêm dependency, không đổi global store hoặc cài lại toàn repo. Sau khi packageManager được pin, `pnpm --version` tại repo trả 11.22.0.

```bash
nvm use
pnpm --version
pnpm install --frozen-lockfile
# Nếu Docker Desktop đang tắt:
docker desktop start
# backend:local:start tự nạp .env.supabase.local (ignored) nếu có.
pnpm backend:local:start
pnpm backend:local:env
pnpm backend:env:check
pnpm backend:local:smoke
pnpm dev
```

`backend:local:env` **chỉ tạo mới** `.env.development.local` (0600), lấy local URL + publishable key từ CLI trong memory, không lưu/log admin key. Không ghi đè env đã có; nếu cần đổi key, lưu/di chuyển riêng file local này rồi tạo lại sau khi xác minh. `.env.local` hiện có của Developer được giữ nguyên. Next ưu tiên `.env.development.local` khi `next dev`; file này không được dùng cho production build. Script check-env dùng chính env loader của Next ở development mode. Khi kiểm tra cloud trong môi trường khác, truyền các biến explicit vào shell, hoặc gọi validator trực tiếp; không copy local credentials vào Vercel.

Copy riêng phần Supabase của `.env.example` khi cần cấu hình thủ công. Không thay `.env.local` đang có bằng template. `.env.example` phải bị validator từ chối cho tới khi thay placeholder.

## Local stack và dữ liệu

- CLI project_id: `dashboard-personal-local`, khác production ref `wcgdvsiiemurehkprvqw`.
- API `http://127.0.0.1:54321`; PostgreSQL `:54322`; Studio `http://127.0.0.1:54323`; shadow DB `:54320`. Nếu port bận, kiểm tra service đang dùng, không kill service khác. Thay port cần sửa config, validator và tests cùng nhau.
- Postgres **17.11** thực tế, cùng major/minor cloud catalog tại P01. Trước link CLI dùng Postgres image 17.11.0.004 / PostgREST 16.4 / Storage 1.82.1; `supabase link` cache versions cloud trong ignored `.temp`, lần local start sau link dùng 17.11.0.003 / PostgREST 14.18 / Storage 1.80.2. Cả hai cấu hình đã chạy local smoke; Auth đều 2.197.0. Fresh clone chưa link dùng CLI defaults, vì vậy phải chạy smoke/reset/types sau link/version thay đổi, không suy ra API parity từ Postgres major. Schema public chưa có business tables/functions; `seed.sql` chỉ SELECT 1. Không tạo owner/domain schema sớm ở P01.
- Data API public schema với `auto_expose_new_tables=false`. Không dùng điều này thay explicit grants/RLS và SQL acceptance P02.
- Local Auth signup/email/anonymous/manual linking/GitHub đều tắt. Callback GitHub dự kiến `http://127.0.0.1:54321/auth/v1/callback`; redirect web chính xác localhost/127.0.0.1:3000/auth/callback. P03 mới enable provider/bootstrap, secrets qua env; chưa có callback route/login được triển khai.
- Storage enabled, max 2MiB, không seed bucket/object; Realtime/analytics/edge runtime/SMTP/S3/vector tắt vì chưa cần.
- CLI Docker publishes ports trên host interfaces (đã quan sát `0.0.0.0`/IPv6); đây là stack demo local, không dùng làm public deployment. Phiên P01 stop riêng stack khi xong; không dừng Docker daemon hoặc các container của project khác. Không khẳng định network option Docker đã giới hạn bind khi inspect chưa chứng minh.

```bash
# Phá dữ liệu CHỈ local; snapshot trước, không dùng khi cần giữ dữ liệu local.
pnpm backend:local:reset --confirm-local-disposable
pnpm backend:types
pnpm test:backend-setup
# Stop riêng project, mặc định CLI giữ backup/volumes:
pnpm backend:local:stop
```

Không chạy `--no-backup`, `--all`, remote reset, migration repair, DROP trên cloud. `backend:local:reset` từ chối thiếu confirmation token hoặc thêm remote flags. `backend:types` cố định `--local --schema public`, validate output và rename atomic; CLI lỗi không làm rỗng types cũ. P01 generated types rỗng là kết quả DB thật, chưa phải contract domain.

## Tách môi trường

Validator `lib/supabase/env.ts` kiểm tra khi caller gọi, không tạo client hay truy vấn ở module scope/build. P02/P03 phải dùng validator này trong server-only client trước request; **API cũ hiện chưa được migrate/gate**. P01 không tuyên bố đã có persistence/Auth application.

| Env | URL/ref | Quy tắc |
| --- | --- | --- |
| local | localhost/127.0.0.1:54321, không cloud ref | APP_ORIGIN local :3000; publishable key local |
| preview | dev project riêng, HTTPS/ref explicit | Cấm production ref; missing env throw, không fallback |
| production | `wcgdvsiiemurehkprvqw`, HTTPS | APP_ORIGIN host thực tế; VERCEL_ENV/APP_ENV phải khớp |

Validator reject secret/service-role/legacy JWT ở publishable slot, URL có credentials/path/query và mismatch Vercel env. Không thể chứng minh key thuộc đúng ref chỉ qua syntax: P03/P11 cần request thật và identity verification. Runtime CRUD sau này dùng user JWT, tuyệt đối không DB owner/service role.

Cloud đã xác minh Dashboard/catalog read-only, HTTPS không key và publishable-key preflight. Public key sẵn có được lưu riêng trong ignored `.env.cloud-tooling.local` (0600), Next không tự load tên này. Chạy `pnpm backend:cloud:smoke` để GET Auth settings (200 với key, 401 thiếu key); OpenAPI root cloud yêu cầu secret key (401 với publishable), script không tăng quyền hoặc dùng admin key. Đây không là business query/RLS proof. Signup cloud còn bật, GitHub/anonymous tắt; owner bootstrap/config provider thuộc P03. CLI existing credential đã link đúng project; schema-only dump qua session pooler Mumbai port 5432 PASS, restore vào database local tách biệt PASS sau khi có scaffold `extensions`, `vault`, publication `supabase_realtime`. Không cần user nhập password mới trong phiên. Workspace hiện linked cloud qua ignored `.temp`; không dùng các lệnh DB mặc định mơ hồ, local chỉ qua `--local` wrapper. Full business/Auth/Storage restore chưa nghiệm thu (P09). Không bật Supabase GitHub schema auto-deploy. Remote migrations chỉ P11 sau QA; chuẩn bị/password/login qua user setup, không gửi chat.

## Snapshot/preflight ngoài Git

User xác nhận data hiện tại toàn demo; production rỗng, không import. Script dưới đây là công cụ bảo toàn, **không có lệnh ghi DB/import**:

```bash
node scripts/data/snapshot.mjs --mode export --classification demo \
  --key /absolute/path/to/public.pem --output /outside/repo/snapshot.enc.json \
  --calendar .data/calendar.json --today .data/today.json
node scripts/data/snapshot.mjs --mode verify \
  --key /absolute/path/to/private.pem --input /outside/repo/snapshot.enc.json
```

Có thể thêm `--notes-url http://localhost:3000/api/notes` cho **server đang sống**, không restart để lấy dữ liệu memory. `--notes`, `--finance`, `--learning`, `--profile` nhận JSON export do user kiểm soát; validate shape/IDs/counts là preflight, domain validators/import transactions đầy đủ thuộc P04–P08. Finance JSON phải là FinanceData, Learning là LearningData, Profile `{personal,address}`. Script chưa tự trích React state; hiện không cần vì user xác nhận toàn mock. Kiểm tra date/time/money/domain semantics đầy đủ trước bất kỳ import thật nào.

Key PEM RSA (>=2048 bit), format envelope `dashboard-snapshot-v1`, RSA-OAEP-SHA256 + AES-256-GCM. Verify giải mã trong memory, kiểm tra checksum/counts/source IDs; không xuất plaintext. Script từ chối ghi output trong repo và không overwrite snapshot. Dữ liệu thật phải có key user quản lý/password manager + backup location riêng trước khi dùng; demo key tự tạo của phiên này không thay setup đó.

Nguồn đã đối chiếu 2026-10-20: [CLI](https://supabase.com/docs/guides/local-development/cli/getting-started), [config](https://supabase.com/docs/guides/local-development/cli/config), [Data API security](https://supabase.com/docs/guides/api/securing-your-api), Next bundled `node_modules/next/dist/docs/01-app/02-guides/environment-variables.md`. Config mẫu lấy từ chính `supabase init` 2.121.0, gồm `auto_expose_new_tables` hiện chưa được web config reference mô tả đầy đủ.
