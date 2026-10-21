# Hướng dẫn nhanh — Tài chính cá nhân

Mở [/finance](http://localhost:3000/finance), chuyển trang bằng sidebar. Trên điện thoại, mở menu ở góc trên. Nút **Ghi giao dịch** luôn có sẵn trong Finance.

Dữ liệu được lưu qua API vào Supabase theo tài khoản chủ sở hữu và được tải lại khi mở trang. Có thể đổi ngôn ngữ VI/EN và giao diện sáng/tối.

## 1. Tổng quan

Xem số dư, tiền đã dành, khoản sắp đến và tiền chưa phân bổ. Chọn tháng để xem thu chi và cơ cấu chi tiêu; chuyển carousel để xem mục tiêu khác. Cảnh báo ngân sách nổi ở góc dưới phải, có nút X và **Xem ngân sách**. Đóng cảnh báo sẽ ẩn cùng nội dung đó trong phiên trình duyệt; thay đổi khoản vượt có thể tạo cảnh báo mới.

## 2. Giao dịch

Ghi khoản thu, chi, hoàn tiền hoặc chuyển khoản. Tìm theo nội dung, lọc theo tài khoản, danh mục hay loại; sửa/xóa ngay trong bảng. Mở **Số dư tài khoản** khi cần xem từng nơi giữ tiền.

**Nhập CSV:** tải mẫu, điền đúng bảy cột, xem trước rồi xác nhận. Một dòng lỗi chặn toàn bộ lượt nhập; dòng trùng chỉ cảnh báo và vẫn được nhập; tối đa 1 MB / 1.000 dòng. **Xuất** tải các giao dịch theo bộ lọc hiện tại. Chưa hỗ trợ mọi định dạng sao kê ngân hàng.

**Thêm danh mục thủ công:** bấm **Danh mục** trên đầu trang Finance, chọn **Thêm danh mục**; nhập tên, mã và chọn Thu nhập/Chi tiêu. Mã dài 1–40 ký tự (`a-z`, `0-9`, `_`, `-`), bắt đầu bằng chữ; không dùng `transfer`. Mã không được trùng, kể cả danh mục đã lưu trữ.

**Tự tạo danh mục từ CSV:** giữ nguyên bảy cột `date,description,amount,kind,category,account,destination`. Trong `category`, điền mã mới như `suc_khoe` hoặc `thuong`. Xem trước hiển thị danh sách sẽ tạo; xác nhận nhập mới lưu danh mục và giao dịch cùng một lần. `income` tạo danh mục thu nhập; `expense`/`refund` tạo danh mục chi tiêu. Tên ban đầu bằng mã. Cùng một mã không được dùng cho cả thu nhập và chi tiêu; danh mục đã lưu trữ hoặc sai loại sẽ báo lỗi. `transfer` không tạo danh mục. Danh mục chi tiêu mới xuất hiện trong ngân sách với hạn mức 0 để bạn tự điều chỉnh. Cột `account` và `destination` vẫn phải là mã tài khoản đang hoạt động có sẵn; không tự tạo tài khoản từ CSV.

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

## Quản lý dữ liệu tài chính

- **Danh mục**: xem danh sách, tìm theo tên/mã, lọc đang dùng/đã lưu trữ/tất cả. Có thể sửa tên, lưu trữ và khôi phục. Danh mục tùy tạo chưa dùng được sửa mã/loại hoặc xóa sau xác nhận. Mã/loại danh mục mặc định hoặc đã có giao dịch/ngân sách bị khóa để bảo vệ dữ liệu; dùng lưu trữ thay vì xóa.
- **Tài khoản & khoản dự kiến**: thêm/sửa, tìm tài khoản và lọc lưu trữ. Tài khoản đã có giao dịch (kể cả tài khoản nhận chuyển khoản) không thể xóa; có thể lưu trữ và khôi phục. Sửa số dư đầu kỳ sẽ thay đổi báo cáo/số dư. Khoản dự kiến có xác nhận trước khi xóa.
- **Ngân sách → Điều chỉnh hạn mức**: chọn **Mặc định** để chỉnh hạn mức chung và chi phí cố định; chọn tháng để chỉnh riêng tháng đó. **Bỏ hạn mức riêng, dùng mặc định** trả tháng đó về cấu hình chung, không thay đổi giao dịch. Tên ngân sách theo tên danh mục.
