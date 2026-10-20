# P01 — Supabase, môi trường và công cụ

Trạng thái: **PASS gate setup/tooling 2026-10-20**, gồm local start/reset, cloud CLI + session-pooler schema dump và restore local tách biệt — [evidence](evidence/P01.md), [runbook](LOCAL_DEVELOPMENT.md). Phụ thuộc: P00. Phase tiếp: [P02](phase-02-schema-security-contracts.md).

## Mục tiêu

Có môi trường dev tái tạo được và nhận diện production rõ ràng, không dùng DB thật để thử test destructive. Project cloud đã có: dasboard-vodinhquan / wcgdvsiiemurehkprvqw / Mumbai ap-south-1, theo thông tin user cung cấp; kiểm tra live khi được truy cập.

## Đầu việc

1. Kiểm tra Node/pnpm thực tế và pnpm-lock; pin Supabase CLI devDependency phiên bản hỗ trợ Node hiện tại. Không dùng latest trôi trong CI. Giữ pnpm là package manager duy nhất.
2. Tạo supabase/config.toml, seed.sql chỉ dữ liệu tổng hợp local, .env.example và tài liệu lệnh dev. Ignore .env thật, .temp, dumps, test tokens và dữ liệu .data.
3. Chạy local Supabase trên container runtime. Match major Postgres 17 nếu CLI hỗ trợ, ghi version khác biệt để test thêm trước production. Không ép phiên bản cũ một cách mù quáng.
4. Thiết lập config local Auth/Storage và URL callback theo cổng thật. Không copy JWT signing secret/service key cloud xuống config commit.
5. Dùng cloud project đã có làm production target, local làm dev/test. Preview dùng local test/DB dev riêng hoặc fail closed, không trỏ production bằng fallback.
6. Kiểm tra security toggles: Data API ON, automatically expose new tables OFF, auto RLS ON nếu có. Lập snapshot grants/default privileges; toggle tắt không đủ chứng minh object cũ đã được thu hồi quyền.
7. Không nối Supabase GitHub auto-deploy schema. Vercel Git integration về sau chỉ deploy app; migration có một lối đi qua CLI đã review.
8. Kiểm tra kết nối HTTPS, tooling DB và project ref. App dùng Data API nên không cần mua IPv4. Với dump/migration, dùng Connect URI tương thích mạng; session pooler là fallback cần kiểm thử, không mặc định transaction pooler phù hợp mọi tool.
9. Đánh giá region: giữ Mumbai; đo RTT và vài truy vấn thực trên authenticated dev/smoke dataset khi có P03. Ghi cold/warm timings, không kết luận region là chậm chỉ từ vị trí. Muốn thay đổi region thì lập quyết định trước import dữ liệu thật.

## Lệnh mẫu để thực thi sau

Sau khi CLI đã pin trong package.json; không chạy những lệnh này chỉ vì đang đọc plan:

```bash
pnpm exec supabase init
pnpm exec supabase start
pnpm exec supabase db reset --local
pnpm exec supabase gen types typescript --local
```

Redirect output generated types vào file qua script đã kiểm tra exit code và atomic rename; lỗi CLI không được làm rỗng file types cũ. `db reset --local` chỉ chạy sau khi đã bảo toàn dữ liệu local cần giữ.

Remote login/link và dry-run thực hiện khi tới P11 hoặc read-only preflight cần thiết; không áp migrations vào project cloud trong phase setup local.

## User setup

U01 trong [USER_SETUP](USER_SETUP.md): kiểm tra project/toggles, lưu password, lấy publishable key đúng môi trường và local runtime. Không cần gửi DB password trong chat, không nâng gói.

## Kiểm thử và gate

- [x] Khởi động local stack thành công và reset local từ config thành công.
- [x] URL/key dev phân biệt cloud; missing env fail closed, không tự chuyển qua production/mock.
- [x] Không có secrets trong git diff/client assets/log; .env.example toàn placeholder.
- [x] Snapshot Data API/RLS catalog P01; grants còn dư đã bàn giao. Acceptance security/RLS sau migration vẫn là **gate P02 chưa thực thi**, không coi toggle là đủ.
- [x] Pin CLI và lưu version trong evidence; có hướng dẫn start/stop không ảnh hưởng dịch vụ khác.
- [x] Thông tin cloud đã xác minh hay còn user-reported được gắn nhãn rõ.

**Cloud preflight đã đạt:** existing CLI credential link đúng project, schema dump qua session pooler `aws-0-ap-south-1.pooler.supabase.com:5432` thành công; bản schema restore vào database local tách biệt đạt sau scaffold managed schemas/publication, scratch DB đã xóa. Không cần user nhập thêm password trong phiên. Full business/Auth/Storage restore thuộc P09. Workspace hiện linked cloud qua ignored `.temp`; mọi lệnh local phải có `--local` như các wrapper đã tạo. Auth/RLS/domain acceptance vẫn thuộc P02 trở đi.

## Rollback

Stop riêng local stack nếu cần; giữ volume/export trước cleanup. Không pause/delete/recreate cloud project để sửa local. Nếu chưa có runtime, ghi blocker P01 và tiếp tục soạn SQL/contracts offline nhưng không đánh dấu local DB test đạt.

Nguồn: [Local migrations](https://supabase.com/docs/guides/local-development/database-migrations), [Data API security](https://supabase.com/docs/guides/api/securing-your-api).
