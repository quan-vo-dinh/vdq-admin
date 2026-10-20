# Học mỗi ngày — bản UI để chốt tính năng

Ngày 20/10/2026. Thay thế giao diện Tickets tại `/apps/tickets`; đường dẫn tạo ticket cũ đưa về trang này.

## Phạm vi

Đây là prototype tương tác với dữ liệu mẫu. React Context giữ thay đổi khi trang đang mở; tải lại trả về mẫu. Không gọi API, không lưu trình duyệt hoặc database, không triển khai backend. Chuỗi 6/13 ngày là mẫu để thử chúc mừng 7/14 ngày. Chưa kết luận đây là thiết kế được duyệt.

## Các tính năng có thể thử

- Tạo/sửa mục học: tên, lời nhắc cá nhân, mục tiêu phút mỗi ngày.
- Điểm danh hôm nay: số phút thực tế và ghi chú không bắt buộc; sửa ghi chú hoặc hoàn tác.
- Mỗi mục có chuỗi hiện tại, chuỗi dài nhất, tổng buổi và lịch 7 ngày.
- Tổng quan số mục hoàn thành hôm nay, số ngày có học ít nhất một mục, tổng phút và kỷ lục dài nhất của một mục.
- Lịch hoạt động 16 tuần; chọn ô để đọc ngày/số mục đã học; nhật ký 8 buổi gần nhất.
- Mốc 3/7/14/30/60/100/180/365 ngày: hộp chúc mừng, cúp chuyển động và confetti. Ngày thường có lời động viên. Tôn trọng reduced motion.
- Tạm dừng/học tiếp mục học; giữ lịch sử. Xác nhận trước khi tạm dừng.
- Nội dung UI VI/EN, theo theme và responsive.

## Quy tắc nghiệp vụ đề xuất

1. Một ngày tính theo Asia/Ho_Chi_Minh (UTC+7). Hôm nay tự cập nhật khi trang mở qua nửa đêm.
2. Mỗi mục có tối đa một lần điểm danh/ngày; sửa buổi không tăng số lần học. Chỉ ghi và hoàn tác hôm nay; không ghi bù quá khứ.
3. Ghi nhận khi thực sự đã học: phút thực tế nguyên từ 1–1.440. Ít hơn mục tiêu vẫn tính. Mục tiêu là lời nhắc, không phải điều kiện khóa điểm danh.
4. Chuỗi hôm qua vẫn hiển thị khi hôm nay chưa học; bỏ trọn một ngày thì chuỗi ngắt. Chuỗi mới bắt đầu từ 1; lịch sử và kỷ lục giữ lại.
5. Tạm dừng không đóng băng chuỗi. Ngày tạm dừng vẫn có thể làm ngắt chuỗi; mục tạm dừng không nằm trong tiến độ hôm nay.
6. Chuỗi thuộc từng mục học. Số ngày hoạt động tổng hợp chỉ yêu cầu ít nhất một mục, không đồng nghĩa tất cả mục đều hoàn thành.
7. Thẻ cột mốc theo mục đang có chuỗi dẫn đầu. Huy hiệu phản ánh chuỗi hiện tại; chưa có bộ sưu tập huy hiệu vĩnh viễn. Sau 365, đích kế tiếp tăng theo năm.
8. Hoàn tác rồi điểm danh lại có thể phát lại animation trong prototype; cần chốt quy tắc chống lặp khi làm bản thật.

## Cần chốt trước bản thật

- Có cho phép ngày nghỉ, đóng băng chuỗi hoặc lịch học theo thứ hay giữ lịch hằng ngày nghiêm ngặt?
- Có muốn huy hiệu vĩnh viễn và phần thưởng riêng cho việc hoàn thành tất cả mục?
- Nhắc học giờ nào, bằng kênh nào; dữ liệu lưu ở đâu và gắn với tài khoản nào?
- Có cần mục tiêu theo số từ/trang/bài ngoài đơn vị phút?

Các mục trên là lựa chọn tương lai, chưa được mô phỏng như đã tồn tại.

## Tổ chức mã nguồn

- `app/(dashboard-layout)/apps/tickets/page.tsx`: route và metadata; render entry component như các ứng dụng hiện có.
- `app/components/apps/learning/index.tsx`: ghép provider và workspace. Các panel, thẻ mục học, form và celebration tách thành component riêng. Workspace chỉ điều phối UI và trạng thái dialog.
- `app/context/learning-context/index.tsx`: state của prototype cùng các thao tác create/edit/check/undo/archive. Dùng functional state updates; component không được thay toàn bộ dữ liệu tùy ý.
- `lib/learning/types.ts`: kiểu dữ liệu nghiệp vụ; `demo.ts`: dữ liệu mẫu; `model.ts`: tính chuỗi, tổng hợp và cập nhật buổi học thuần.
- `app/components/apps/learning/locale.ts`: dùng LanguageContext chung theo cách Calendar tổ chức locale. `types.ts` trong feature chỉ giữ kiểu trạng thái UI.
- Dùng nguyên các primitives ở `components/ui`, HeadingText, StyleAwareWrapper và StyleDivider; form theo FieldGroup/Field và useState; nhãn đóng dialog có VI/EN. CSS giữ trong globals theo quy tắc shadcn, selector riêng `learning-*`, màu từ theme tokens.

Prototype không thêm Route Handler/SWR vì chưa thuộc phạm vi dữ liệu thật. Khi triển khai backend, nối Route Handler → SWR trong context → view như quy ước dự án; giữ component không phụ thuộc cơ chế lưu trữ.

Nhãn đánh dấu dữ liệu minh họa trên giao diện đã được gỡ theo yêu cầu. Cơ chế prototype và phạm vi lưu dữ liệu nêu trên vẫn áp dụng.
