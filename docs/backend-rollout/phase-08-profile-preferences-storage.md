# P08 — Profile, thiết lập và ảnh goal

Bản tinh gọn v2, 2026-10-20. Chưa triển khai. Phụ thuộc P07. Tiếp: [P09](phase-09-backup-operations.md).

## Đầu ra cần đạt

Form personal/address Save thật, ngôn ngữ/theme đồng bộ khi cần, ảnh goal tồn tại sau reload. Giữ UI hiện có, không social backend/Blog/Developer hoặc uploader mới cho Notes/avatar.

## Schema và đầu việc

1. profiles owner_id PK; các field đúng form personal/address hiện có, contact/social URLs, metadata giới thiệu; timestamps/revision. JSON whitelist cho social_links/address, không tùy ý ghi auth identity.
2. user_preferences owner_id PK, locale/theme và finance_starts_on thực sự cần; timezone cố định Việt Nam, thiết lập layout theo thiết bị vẫn localStorage. Không cố đồng bộ mọi UI state.
3. /api/profile GET/PATCH và /api/preferences GET/PATCH theo revision; nút Save await commit, giữ draft nếu lỗi. Header/shared profile cập nhật cùng dữ liệu, contact email không đổi quyền GitHub.
4. Thêm private bucket personal-media qua setup idempotent; owner-prefix Storage policies, size <=2 MiB và JPEG/PNG/WebP. Chỉ goal image theo tính năng upload đang có.
5. finance_goals.image_path nullable là đủ; chưa cần media_assets registry/FSM pending-attached-orphan. Sinh path riêng owner/goals/UUID.ext, không overwrite ảnh cũ.
6. Upload endpoint giới hạn body, kiểm tra MIME/bytes và decode ảnh trước attach; không tin file.type/đuôi. Bucket size/MIME và RLS vẫn bảo vệ direct Storage writes; chỉ server-validated object được ghi image_path qua luồng app, direct owner write vẫn là hành vi owner tự quản lý, không hứa API chặn mọi self-upload.
7. Upload mới → update goal bằng CAS → xóa ảnh cũ sau commit. Attach fail thì xóa object mới nếu có thể và giữ ảnh cũ; cleanup fail ghi rõ để dọn thủ công có danh sách/dry-run, không dựng worker/daemon.
8. Path từ server cho đúng bucket/prefix, signed URL ngắn hạn lúc đọc; DB không lưu URL có expiry hoặc base64. Refresh signed URL khi hết hạn, không public-cache ảnh riêng tư.
9. Locale/theme sync ưu tiên server đã lưu, không vòng lặp PUT mỗi render/hydration mismatch. Avatar tĩnh hiện có tiếp tục dùng; ảnh mặc định goal giữ fallback.
10. Profile/goal image errors hiển thị thật, không báo saved khi chỉ đổi state.

## User setup

U08 tại [USER_SETUP](USER_SETUP.md): private bucket/size/MIME/policies. Không paid image transformations, không avatar consent mới, không tự tạo cloud Storage objects trong lượt sửa plan.

## Kiểm tra bắt buộc và gate

- [ ] Profile Save và locale/theme còn sau reload/tab khác, login identity không đổi.
- [ ] Goal upload/save/read lại, signed expiry và attach fail giữ ảnh cũ.
- [ ] Anon/non-owner không đọc/ghi private bucket; path sai/ảnh giả/oversized bị xử lý.
- [ ] Browser một vòng form và ảnh desktop/mobile; DB/RLS checks mới + lint/build cuối frontend change.

## Hoãn / rollback

Không media FSM, generalized file manager, scheduled orphan cleanup, image upload cho Notes/avatar chưa có UI. Khi Storage lỗi tắt upload mới nhưng giữ record/ảnh cũ; đừng drop bucket để sửa form. P09 backup phải chứa object bytes, không chỉ image_path.
