# P09 — Backup/restore đủ dùng trước dữ liệu thật

Bản tinh gọn v2, 2026-10-20. PASS local, [evidence](evidence/P09.md), [runbook](BACKUP_RESTORE.md). Hosted source backup/config thuộc P11. Phụ thuộc P08. Tiếp: [P10](phase-10-integration-release-qa.md).

## Đầu ra cần đạt

Một lệnh backup dễ chạy và một runbook restore đã thử trên target tách biệt. Không xây một hệ thống backup/monitoring riêng. P01 đã kiểm tra schema dump/tooling: dùng lại, không chạy lại catalog/phiên bản/restore schema rỗng chỉ để thêm evidence.

## Backup tối thiểu

1. Reuse CLI connection, ignore/secret handling và encryption tool đã có. Một script ngắn export business data + schema version + owner mapping/config cần thiết, giữ trong thư mục ngoài Git và mã hóa. Scope dữ liệu: Notes, Calendar/settings, Finance, Learning, Profile/Preferences và ảnh goal; không yêu cầu export/restore Today, Quick Note/priorities/Activity hoặc dựng lại trang đã xóa.
2. Tập ảnh referenced trong private bucket có object bytes + path manifest; DB dump không bao gồm ảnh. Backup consistent bằng snapshot DB và tạm ngừng writes ngắn nếu cần để thống nhất DB/files, không dựng change capture.
3. Xác minh dump có data, schema public/private phù hợp. CLI mặc định không tự bao gồm auth/storage managed schemas; không coi schema-only dump P01 là đủ.
4. Owner recovery mặc định re-bootstrap đúng GitHub ID và remap owner UUID/path khi target khác; ghi một thủ tục cụ thể. Không bắt làm song song cả full auth schema migration và remap.
5. Summary tối thiểu: thời điểm, app/schema version, counts, source/target, vị trí encrypted bundle và check lỗi. Không tạo nhiều JSON receipt hoặc log payload cá nhân.
6. Giữ vài bản gần nhất (mặc định 3 bản tốt) và recovery key riêng; không cần retention engine 7 daily/4 weekly hay thêm dashboard giám sát.
7. Có backup ban đầu trước live và một lịch vận hành user chọn: chạy lệnh hằng ngày/thường xuyên theo mức chấp nhận mất dữ liệu. Nếu tự động hóa được bằng runner sẵn có thì thêm lịch đơn giản, không tự bật dịch vụ trả phí.
8. Local runner tắt/ngủ thì backup không chạy; không cam kết RPO 24h/RTO 4h khi chưa bảo đảm. Ghi recovery point thực tế = backup thành công gần nhất. Backup thủ công được chấp nhận làm baseline nếu user biết và nhận trách nhiệm lịch chạy.

## Restore drill một lần

- Target local/dev tách biệt, guard không overwrite production. Tái tạo migrations → owner bootstrap/remap → import business data đúng FK → khôi phục ảnh.
- Dùng fixture đủ Notes/event/transaction/check-in/profile/goal image; mở app kiểm tra dữ liệu và owner-only.
- Check counts/tổng tiền/ngày/ảnh dùng được, thử giải mã bundle. Thiếu dữ liệu/Auth mapping/ảnh thì gate fail.
- Viết lại đúng lệnh thao tác và kết quả trong một evidence; không cần matrix lỗi storage/notification/rotation toàn diện khi chưa xây scheduler.

## User setup

U09 tại [USER_SETUP](USER_SETUP.md): chọn nơi lưu ngoài project, giữ recovery key/password và chọn manual hay runner có sẵn. Thiếu phần này thì code/drill fixture vẫn làm được, nhưng trước dùng dữ liệu thật phải xác nhận backup workflow sẽ dùng. Không xin secret qua chat.

## Gate và rollback

- [x] Backup gồm data thật theo scope lẫn ảnh, giải mã được, restore thành công sang target khác; owner access đúng.
- [x] Có một command/runbook user chạy được và lịch vận hành trung thực, không hứa job đã hoạt động nếu chưa cấu hình.
- [x] Failure không xóa bản backup tốt, không plaintext dump/key trong Git.
- [x] App/database production không bị reset vì drill. Tool lỗi sửa riêng tool; không chỉnh dữ liệu app để làm test PASS.

## Hoãn sau lần release đầu

GitHub Actions backup pipeline, hosted scheduler riêng, alert integration, prune engine, restore failure matrix và retention dài hạn là tùy chọn. Nếu user cần uptime backup/RPO chặt hơn thì triển khai riêng, không bắt buộc để hoàn tất web một người dùng.

Nguồn giới hạn cần nhớ: [Supabase backups](https://supabase.com/docs/guides/platform/backups).
