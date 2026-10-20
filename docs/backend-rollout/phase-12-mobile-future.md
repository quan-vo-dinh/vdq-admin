# P12 — PWA trước, APK khi cần

Bản tinh gọn v2, 2026-10-20. Dự kiến tương lai, chưa triển khai. Phụ thuộc P11; không chặn hoàn thành web/backend hiện tại.

## Phạm vi

Tái sử dụng web/backend/Auth/DB đã chạy. Chỉ thực hiện nhánh user giao; không mặc định làm cả PWA, TWA lẫn React Native.
Start URL/deep link/navigation và save/read smoke chỉ dùng các trang/module đã được chấp nhận; không dùng `/today`,
không đưa Today/Quick Note/priorities/Activity trở lại qua PWA, APK hoặc một trang thay thế.

## 12A — PWA nhỏ

1. Giữ UI responsive hiện có, sửa chỗ thực sự cản thao tác điện thoại; thêm manifest/icon/start URL/display/HTTPS.
2. Test install/resume/update/login và save một record trên Android. Không bắt buộc service worker/offline cache chỉ để có nhãn PWA; kiểm tra khả năng cài thực tế của browser hiện tại.
3. Nếu cần service worker thì chỉ cache static shell; loại Auth/API/private HTML/RSC khỏi cache public. Offline mutation báo chưa lưu và giữ draft, chưa xây sync queue.
4. Không đổi Next sang static export hoặc cố nhét Node server/DB key vào app.

## 12B — APK bằng TWA khi user cần file cài

1. App ID/name/icon/signing keystore do user chọn và giữ khóa riêng.
2. Bubblewrap/TWA dùng web manifest, assetlinks.json đúng domain/signature; build APK và cài thiết bị thật.
3. Test GitHub redirect/back/resume và record đồng bộ với web. TWA vẫn cần web online, không tự có native/offline.
4. Tự cài APK không đồng nghĩa phát hành Google Play; không mua store account/cloud build mặc định.

## User setup

U12 [USER_SETUP](USER_SETUP.md): icon/name, thiết bị Android; nhánh APK mới cần signing key và backup khóa. Không thêm callback native/bearer auth hay Expo secrets khi chưa chọn native client.

## Gate, kiểm tra và rollback

- [ ] Chỉ nhánh được giao có artifact/test tương ứng; web production không bị phá.
- [ ] Android login/logout/resume và save/read cùng data web, private cache/token không rò rỉ.
- [ ] Offline trạng thái trung thực, không báo saved giả.
- [ ] Evidence ngắn trên thiết bị thật; APK phải là file build thật khi chọn 12B.
- Rollback manifest/service worker/APK bản tương thích, không reset database.

## Hoãn

React Native/Expo, bearer/mobile auth adapters, offline-first outbox/tombstone/conflict protocol là kế hoạch riêng khi có nhu cầu native thật. Không viết trước để 'chuẩn bị đa nền tảng'.
