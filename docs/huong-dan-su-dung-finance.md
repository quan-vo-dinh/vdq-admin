# Hướng dẫn nhanh — Tài chính cá nhân

Mở [/finance](http://localhost:3000/finance), chuyển trang bằng sidebar. Trên điện thoại, mở menu ở góc trên. Nút **Ghi giao dịch** luôn có sẵn trong Finance.

**Đây là bản trải nghiệm:** dữ liệu minh họa đến 15/10/2026; thay đổi giữ khi chuyển trang trong Finance nhưng mất khi tải lại toàn bộ trang. Có thể đổi ngôn ngữ VI/EN và giao diện sáng/tối.

## 1. Tổng quan

Xem số dư, tiền đã dành, khoản sắp đến và tiền chưa phân bổ. Chọn tháng để xem thu chi và cơ cấu chi tiêu; chuyển carousel để xem mục tiêu khác. Cảnh báo ngân sách nổi ở góc dưới phải, có nút X và **Xem ngân sách**. Đóng cảnh báo sẽ ẩn cùng nội dung đó trong phiên trình duyệt; thay đổi khoản vượt có thể tạo cảnh báo mới.

## 2. Giao dịch

Ghi khoản thu, chi, hoàn tiền hoặc chuyển khoản. Tìm theo nội dung, lọc theo tài khoản, danh mục hay loại; sửa/xóa ngay trong bảng. Mở **Số dư tài khoản** khi cần xem từng nơi giữ tiền.

**Nhập CSV:** tải mẫu, điền đúng bảy cột, xem trước rồi xác nhận. Hệ thống bỏ dòng lỗi và dòng trùng đã nhận diện; tối đa 1 MB / 1.000 dòng. **Xuất** tải các giao dịch theo bộ lọc hiện tại. Chưa hỗ trợ mọi định dạng sao kê ngân hàng.

## 3. Ngân sách

Chọn tháng, xem mức đã chi so với hạn mức. Chọn danh mục và **Điều chỉnh hạn mức** để sửa. Tabs **So sánh hạn mức / Radar danh mục** cho hai cách nhìn cùng dữ liệu; radar vượt 100% nghĩa là vượt mức.

## 4. Mục tiêu

Tạo hoặc sửa tên, ảnh, biểu tượng, số tiền cần có, số đã dành, mức góp tháng và ngày mong muốn. Chọn một trong sáu ảnh/icon mẫu hoặc dùng ảnh riêng JPG, PNG, WebP tối đa 2 MB; icon vẫn chọn độc lập khi dùng ảnh riêng. **Phân bổ thêm** chuyển tiền chưa phân bổ sang mục tiêu, không làm tăng tổng số dư. Mức góp tháng chỉ là kế hoạch, không tự ghi giao dịch. Xóa mục tiêu sẽ giải phóng phần tiền đã dành.

## 5. Dòng tiền

Chọn 30/60/90 ngày. Chỉnh thu nhập, chi phí tháng, ngày nhận tiền và mức muốn giữ lại; xem số dư bằng biểu đồ hoặc lịch. Chi phí tháng cần loại trừ các khoản sắp đến đã liệt kê để tránh tính hai lần. Các khoản này được trừ một lần vào ngày đã khai báo.

## Ba quy tắc đọc số liệu

- Chuyển khoản nội bộ không phải thu nhập hoặc chi tiêu.
- Hoàn tiền được trừ khỏi chi tiêu.
- Tiền chưa phân bổ = số dư − tiền dành cho mục tiêu − khoản sắp đến đã khai báo; chưa trừ khoản tương lai chưa nhập.

Phạm vi sản phẩm: [bối cảnh cô đọng](personal-finance-context.md). Chi tiết triển khai: [Personal Finance UI](personal-finance-ui.md).
