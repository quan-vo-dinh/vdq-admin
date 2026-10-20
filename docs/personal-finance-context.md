# Personal Finance — bối cảnh cô đọng

Mục tiêu: quản lý tiền cá nhân ngay trong dashboard hiện có, ít nhập liệu và dễ hiểu.

Người dùng cần trả lời ba câu hỏi:

- Hiện có bao nhiêu tiền, còn bao nhiêu chưa dành cho việc khác?
- Tháng này tiền đi đâu, danh mục nào đang vượt mức?
- Đã dành được bao nhiêu cho các mục tiêu?

## Phạm vi chính

| Trang     | Giữ lại                                                              |
| --------- | -------------------------------------------------------------------- |
| Tổng quan | Nguồn tiền, thu chi, cơ cấu chi tiêu, mục tiêu nổi bật               |
| Giao dịch | Thu, chi, hoàn tiền, chuyển khoản; tìm/lọc và nhập/xuất CSV          |
| Ngân sách | Hạn mức theo danh mục, phần còn lại hoặc vượt mức                    |
| Mục tiêu  | Số cần có, đã dành, mức góp tháng và ngày mong muốn                  |
| Dòng tiền | Số dư dự kiến từ thu nhập, chi phí và khoản sắp đến                  |

Điều hướng bằng sidebar. Tabs trong trang chỉ đổi góc nhìn hoặc tình huống. Giữ biểu đồ, carousel, lịch, slider và dialog khi chúng giúp đọc hoặc chỉnh dữ liệu dễ hơn; thông tin phụ có thể thu gọn bằng accordion.

## Tạm bỏ

Các bảng tổng hợp trùng nhau; chỉ số hoạt động vụn; dự đoán góp tiền quá chi tiết; ưu tiên mục tiêu tùy chỉnh; trả góp và phí vay; thời gian bù lại các quỹ; cú sốc chi tiêu riêng; kịch bản tự tăng/giảm 10%; xuất báo cáo mô phỏng.

Chưa triển khai kết nối ngân hàng, quản lý nợ, đầu tư hay tư vấn mua sản phẩm. Chỉ xem xét thêm khi có nhu cầu thực tế.

## Dữ liệu và cách tính

Hiện dùng số liệu minh họa đến **15/10/2026**, chỉnh sửa trong phiên và đặt lại khi tải lại trang. Không suy ra thu nhập hoặc số dư thật từ tài liệu cũ.

Chuyển khoản không tính là thu chi; hoàn tiền giảm chi; tiền dành cho mục tiêu vẫn nằm trong số dư. Dự báo dùng giả định có thể sửa, không phải cam kết kết quả. Trước khi dùng dữ liệu thật cần có lưu trữ và xác thực phù hợp.
