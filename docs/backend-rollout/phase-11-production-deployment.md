# P11 — Deploy production rỗng và bàn giao

Bản tinh gọn v2, 2026-10-20. Đã thực thi một phần; gate chưa PASS. Xem evidence/P10.md và evidence/P11.md. Phụ thuộc P10. Web/backend trong scope hoàn thành khi phase này đạt. [P12](phase-12-mobile-future.md) là tương lai.

## Đầu ra cần đạt

Next.js trên Vercel Hobby + Supabase project hiện có, GitHub owner login, tất cả module trong scope lưu thật, backup workflow dùng được. Không mua hạ tầng mới, đổi region hay import demo.

## Thứ tự thực hiện

1. Kiểm tra đúng ref wcgdvsiiemurehkprvqw và migration history hiện tại, reuse P01 credentials/tooling. Nếu remote thay đổi thì reconcile đúng phần đó, không lặp toàn catalog audit/UI inventory hoặc remote reset.
2. User U11 tạo/chọn Vercel Hobby project, đúng repo cá nhân/branch thực tế, env Production đúng Supabase URL/key, owner/origin. Preview không trỏ DB thật. Node/pnpm theo repo; Next runtime, không Docker Vite/Nginx/static export.
3. Chốt domain vercel.app, function region gần Mumbai (candidate bom1 nếu khả dụng) một region trên Hobby. Giữ Supabase ap-south-1; chưa benchmark/chuyển region.
4. Backup target nếu đã có dữ liệu. Hiện user chọn dữ liệu mock bỏ được, production khởi tạo rỗng; không dựng freeze/import/mapping/source snapshot pipeline. Nếu phát sinh dữ liệu thật kể từ plan thì dừng nhánh 'rỗng' và bổ sung backup/cutover có mục tiêu trước ghi.
5. Dùng CLI đã linked, review migration list + db push --linked --dry-run, sau đó db push --linked khi đúng gate thực thi. Không seed demo, không migration repair/reset để ép khớp. SQL/grants/RLS của app kiểm tra đúng các object mới.
6. Hosted GitHub bootstrap theo P03 sau foundation: callback provider về Supabase cloud, app callback về domain đúng; xác minh provider numeric ID → registry/env khớp → tắt signups/providers thừa/manual linking → relogin. Không public first-user-wins.
7. Deploy bản release đã test, /api/code an toàn, API ngoài scope deny/gate nhưng source/mock giữ nguyên. Mỗi feature trong scope không fallback memory/file/demo.
8. Smoke production bằng record tạm nhận diện được: Notes create/save, Calendar, transaction, check-in, profile/goal image. Test anon/direct Data API quyền; cleanup chỉ record smoke, không full regression/stress trên DB thật.
9. Redeploy hoặc đổi process deployment, xác minh record đã lưu còn và mở thiết bị/tab khác đúng. Backup P09: chạy một bundle production đầu tiên, xác minh dùng được; restore drill P09 còn áp dụng thì không bắt lặp toàn drill, trừ khác version/schema/owner/Storage path ảnh hưởng.
10. Bàn giao URL/release/migration version, cách login/backup và thao tác user còn thiếu. Không công bố RPO hay scheduler đã vận hành nếu user chọn backup thủ công.

Trước chạy migration cloud: rà/tách phần Today trong migration local gộp 00400 và guard 00500.
User đã loại trang/module Today khỏi scope release; không deploy bảng/RPC Today chỉ vì đã tồn tại ở local.
Không publish `/today`, `/api/today`, TodayProvider, widget Quick Note/priorities/Activity hoặc consumer của chúng trong release.
Không có bước bootstrap, smoke, backup, bàn giao hay acceptance riêng cho Today. Các helper dùng chung còn phục vụ Calendar/Notes được giữ theo dependency thực tế.
Không sửa migration history local đã áp dụng hoặc drop local data trong lượt xóa trang.

## User setup

U11/U03/U09 tại [USER_SETUP](USER_SETUP.md): Vercel account/repo/env/domain, OAuth secrets/consent, owner ID và backup destination/key/lịch chạy. Đặt secret trong dashboard/env kín, không chat. Code/tests độc lập làm trước khi gặp blocker tài khoản; không xin xác nhận lặp lại cho phần đã được user cho phép khi thực thi.

## Gate production

- [ ] Domain thật owner login/logout được; anon/non-owner không đọc/ghi được qua API/Data API; secrets/cache đúng.
- [ ] Notes/Calendar/Finance/Learning/Profile/Preferences/goal images lưu thật, reload/redeploy không mất.
- [ ] Production khởi tạo không có tiền/check-in/event demo; không xây Blog/Developer/social backend.
- [ ] Migrations đúng target, Free plan giữ nguyên, không thêm paid add-on.
- [ ] Backup production đầu tiên và P09 drill có hiệu lực; user biết workflow/lịch chạy/recovery point.
- [ ] Một evidence deployment ngắn, residual blockers nói rõ, không gọi mobile đã hoàn thành.

## Rollback

App lỗi: khóa mutation nếu cần và rollback bản tương thích DB, forward fix schema. OAuth lỗi: sửa callback/owner config, không mở auth bypass. DB/data lỗi: giữ bản backup hiện tại và phục hồi theo P09 nếu cần, không restore snapshot demo/truncate để 'làm sạch'. Khi chưa có dữ liệu thật thì sửa schema nhanh trên local trước, remote vẫn forward migration.

## Hoãn

Không GitHub schema auto-deploy song song CLI, không yêu cầu CI/CD migration workflow, branch staging cloud, multi-region failover, importer mock hay restore matrix production để release một app cá nhân.
