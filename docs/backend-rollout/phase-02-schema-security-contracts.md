# P02 — Nền tảng owner/RLS tối thiểu

Bản tinh gọn v2, 2026-10-20. Trạng thái: **PASS local**, xem [evidence P02](evidence/P02.md). Phụ thuộc P01 đã PASS. Tiếp theo: [P03](phase-03-github-owner-auth.md). Đọc [nguyên tắc thực thi](README.md#nguyên-tắc-thực-thi-v2) và [HANDOFF](HANDOFF.md).

## Đầu ra cần đạt

Một migration foundation nhỏ, kiểm tra quyền local đạt, đủ để P03 triển khai GitHub login. Chưa xây domain hay một framework backend tổng quát.

## Làm trong phase này

1. Tái sử dụng config, env validator, CLI, local scripts và generated types của P01. Nếu stack đã dừng, start bằng script có sẵn; không làm lại inventory/cloud UI/dump/restore/version benchmark.
2. Migration tạo private.app_owner: singleton=true PK, user_id UUID UNIQUE FK auth.users ON DELETE RESTRICT, github_user_id text UNIQUE, enabled boolean; mặc định chưa có owner production. Không expose bảng này qua Data API.
3. Tạo private.is_owner() kiểm tra auth.uid() với registry enabled; helper được cấp quyền tối thiểu, fixed search_path nếu SECURITY DEFINER, tên object đầy đủ schema. Thêm public.assert_owner() nếu server cần đọc kết quả qua user JWT, chỉ trả identity hiện tại hợp lệ, không trả registry.
4. Ghi rõ grants/default privileges và quy tắc RLS dùng cho bảng về sau: owner gate + owner_id=auth.uid(), USING/WITH CHECK tương ứng; không business access cho anon. Không sửa hàm platform chỉ vì thấy SECURITY DEFINER: audit phạm vi app, tránh làm hỏng automatic RLS của Supabase.
5. Có ví dụ policy/fixture nhỏ trong test local cho owner/non-owner/anon, nhưng không tạo bảng test tồn tại trong production migration. Không cần sinh toàn bộ bảng Notes/Finance.
6. Chốt lỗi tối thiểu HTTP 400/401/403/404/409/500, UUID, ngày Việt Nam, revision tăng do DB. Chỉ thêm helper TypeScript khi P03/P04 dùng thật; generated types cập nhật bằng script đã có.

## Quyết định đơn giản hóa

- Không private.mutation_requests hoặc ledger idempotency đa domain; không generator/template engine, abstract repository, role framework.
- CRUD một bảng dùng supabase-js với RLS và query filter; update/delete qua API có expectedRevision, một câu lệnh kiểm tra revision. DB helper/trigger tăng revision được thêm khi domain đầu tiên cần (P04), không dựng framework CAS ở đây.
- Cách này bảo vệ xung đột của các API app; không hứa RLS cưỡng chế expectedRevision cho owner tự gọi Data API trực tiếp. RLS vẫn chặn người ngoài; constraints bảo vệ bất biến bắt buộc.
- RPC dành cho transaction nhiều bước/bất biến cần atomic, ví dụ Finance CSV. Không bọc mọi SELECT/CRUD vào SECURITY DEFINER.
- Tiền/CSV/precision thuộc P06; rich-text validation thuộc P04; backup/restore thuộc P09. Không kiểm thử các miền chưa xây.
- Với module đơn giản, một file server/domain có query+mapping là đủ; tách service/repository khi có logic đáng kể, không bắt buộc đủ bốn thư mục mỗi domain.

## User setup

Không cần OAuth hay UUID thật để hoàn thành P02: dùng hai synthetic auth identities local. Không yêu cầu user nhập lại key/password đã có. Cloud migrations vẫn ở P11.

## Kiểm tra bắt buộc và gate

- [x] Migration áp được trên local và chạy lại từ migrations trên DB test disposable khi cần; không reset phiên local đang có dữ liệu cần giữ.
- [x] Owner fixture được phép, anon/non-owner/missing-or-disabled-owner bị từ chối; registry không sửa được từ client.
- [x] Grants/helper EXECUTE/search_path đúng phạm vi, private schema không expose; không dùng admin role để chứng minh RLS.
- [x] Generated types hợp lệ. Không chạy full frontend build nếu chỉ đổi SQL; nếu thêm TS thì type/build theo ảnh hưởng thực tế.
- [x] Evidence ngắn: migration, lệnh test và kết quả, blocker còn lại. Không cần nhiều JSON receipt/screenshot catalog.

## Không làm thêm / rollback

Không cloud push, domain tables, snapshots mới, restore drill, benchmark hoặc chữa lint baseline. Local SQL chưa release có thể sửa/reset DB test; migration đã deploy thì forward fix. Giữ P00/P01 evidence nguyên vẹn.
