# Personal Finance UI

Finance giúp xem thu chi, đặt hạn mức, dành tiền và dự báo dòng tiền. [Bối cảnh cô đọng](personal-finance-context.md) là phạm vi hiện tại; [hướng dẫn nhanh](huong-dan-su-dung-finance.md) mô tả thao tác.

Ngày 20/10/2026: đã gỡ trang Mô phỏng và chức năng so sánh quyết định mua sắm. Các ghi nhận kiểm tra Mô phỏng bên dưới là lịch sử trước khi gỡ.

## Bố cục và component

Điều hướng giữa năm trang bằng sidebar của dashboard; đã bỏ thanh điều hướng ngang trùng lặp. Giữ theme trung tính, responsive và VI/EN. Tabs trong trang dùng cho góc nhìn hoặc tình huống.

Các nhóm nội dung dùng `FinanceBoard` dựa trên `StyleAwareWrapper` với lưới 12 cột, viền và khoảng cách 1px như dashboard Modern. Giữa các hàng chính dùng `<StyleDivider wrapperClassName="col-span-12" />`; tiêu đề panel dùng icon rõ nét trong ô 32px. Biểu đồ thu chi dùng `ChartLine`.

Tab biểu đồ dùng `value` và state riêng, chỉ nhận giá trị thuộc các góc nhìn hợp lệ. Không dùng `defaultValue` cho các nhóm này: khi Next.js ẩn trang bằng React `Activity`, Base UI có thể tạm gỡ đăng ký tab và đặt lựa chọn tự quản lý về `null`, khiến cả hai panel biến mất khi quay lại.

Typography: tiêu đề trang 24px (20px trên mobile), tiêu đề khối/thẻ/hộp thoại 16px, nội dung và điều khiển 14px; số liệu chính dùng thang 24/20px. `FinanceHeading` ghép `@shadcn-dashboard/animated-text-02` với heading ngữ nghĩa; gradient theo màu theme, hỗ trợ reduced motion và forced colors. Popup/form giữ cùng cỡ chữ qua `data-finance-typography`.

| Trang     | Nội dung chính và component                                                                                                              |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Tổng quan | Biểu đồ thu chi, bảng nguồn tiền 2×2, donut chi tiêu, carousel mục tiêu với radial progress; alert khi vượt ngân sách                    |
| Giao dịch | Ba tổng thu/chi/chênh lệch, Combobox và Tabs lọc, TanStack Table có phân trang; Dialog sửa/xóa/CSV; số dư từng tài khoản trong Accordion |
| Ngân sách | Tabs biểu đồ thanh/radar, radial tổng sử dụng, Select danh mục và Dialog chỉnh hạn mức                                                   |
| Mục tiêu  | Hai tổng đã dành/chưa phân bổ; các thẻ radial progress; Dialog thêm/sửa/phân bổ, Calendar chọn ngày                                      |
| Dòng tiền | Ba số dư bắt đầu/cuối/thấp nhất; Tabs biểu đồ/lịch; bốn giả định; Accordion khoản sắp đến                                                |

Money inputs dùng InputGroup định dạng VND và Slider khi phù hợp. NumberTicker hỗ trợ reduced motion. Biểu đồ dùng Recharts trong ChartContainer, số âm và hoàn tiền giữ đúng dấu. Radar chỉ gồm danh mục có hạn mức, hiển thị chi ròng âm ở 0%; sổ giao dịch giữ nguyên số gốc.

Tổng quan dùng Base UI Toast nổi ở góc dưới phải cho cảnh báo ngân sách, có nút đóng và dẫn đến ngân sách; không chiếm hàng trong layout. Dismissal lưu trong `sessionStorage` theo tháng/danh mục/số tiền vượt. Nguồn tiền hiển thị đầy đủ VND, tỷ trọng phân bổ, số tài khoản/khoản sắp đến. Các metric dùng icon lớn với màu theo ý nghĩa. Ngân sách bổ sung hạn mức tháng, chi ròng, số danh mục trong hạn và chi phí cố định. Mục tiêu lưu `visual` và ảnh riêng tùy chọn trong phiên; ảnh mẫu từ Unsplash, ảnh riêng được đọc tại trình duyệt.

Đã bỏ các panel và chỉ số lặp, lọc/đặt ưu tiên mục tiêu, tính mức góp bắt buộc để kịp ngày, trả góp, thời gian bù quỹ, khoản chi đột xuất riêng, kịch bản ±10% và CSV mô phỏng. CSV giao dịch vẫn giữ.

## Dữ liệu và mã nguồn

- `/api/finance` cung cấp demo read-only đến **15/10/2026** qua fetcher SWR; server layout cấp cùng dữ liệu ban đầu. Đây không phải số dư cá nhân thật.
- `app/context/finance-context/` giữ chỉnh sửa trong phiên Finance; chuyển trang vẫn giữ, tải lại toàn bộ sẽ đặt lại. Chưa có lưu trữ hay kết nối ngân hàng.
- `app/components/finance/` chứa các trang, widget, form và controls; `lib/finance/` chứa model, demo, CSV và bản dịch. UI dùng các primitive Base UI trong `components/ui/`.
- Chuyển khoản bảo toàn tổng tiền và không tính thu chi. Hoàn tiền giảm chi theo danh mục. Phân bổ mục tiêu giữ chỗ trong tiền hiện có.
- Dự báo bắt đầu từ số dư hiện tại, cộng thu nhập vào ngày đã chọn, trừ chi phí ngày làm tròn VND và các bill một lần. Mô phỏng giữ nguyên giá và mức tích lũy đã nhập, không ghi giao dịch.
- CSV bảy cột: UTF-8, tối đa 1 MB / 1.000 dòng, kiểm tra ngày/số tiền/tài khoản/danh mục và khóa trùng; export thoát công thức spreadsheet. Chưa phải importer sao kê đa ngân hàng.

## Kiểm tra

Typography: build, lint Finance và hồi quy tab/Activity qua sau khi thêm heading động. Chrome kiểm tra Tổng quan ở dark mode; Safari kiểm tra thẻ mục tiêu, Dialog tạo mục tiêu ở light mode và bố cục mục tiêu 393×768. Lint toàn repo vẫn có 27 lỗi / 55 cảnh báo ngoài Finance.

Hồi quy tab: kiểm thử DOM trên các view Finance thật với dữ liệu demo, React 19 `Activity` và Base UI đang cài. Trước sửa, Dòng tiền và Chi tiêu tổng quan mất lựa chọn ngay lần quay lại đầu; sau sửa, cả ba nhóm biểu đồ qua 6 lần ẩn/hiện mỗi nhóm và có đúng một panel sau server render/hydration. Ba tình huống Mô phỏng, năm bộ lọc Giao dịch và nội dung Mục tiêu cũng giữ state khi ẩn/hiện. Build và lint hai file sửa qua; lint toàn repo vẫn 27 lỗi / 55 cảnh báo ngoài Finance. Chưa kiểm tra trực quan đợt này vì công cụ trình duyệt không truy cập được cửa sổ; kiểm thử DOM không xác nhận hình vẽ/kích thước Recharts.

Cập nhật layout: Safari xác nhận icon thu chi mới và divider trên Tổng quan, Mục tiêu, Mô phỏng; kiểm tra thêm Tổng quan ở 393×768. Lint các file sửa và production build qua; lint toàn repo vẫn còn 27 lỗi / 55 cảnh báo có sẵn ngoài Finance.

Ngày 16/10/2026: `pnpm test:finance` qua 13 bài; ESLint phần Finance và `pnpm build` thành công. Safari kiểm tra đủ sáu trang, radar và lịch dự báo; desktop 1366×768 và mobile 393×852, gồm tiếng Anh/giao diện tối. Sửa hạn mức mua sắm từ 1 lên 1,5 triệu cập nhật đúng tổng; mô phỏng điện thoại chờ sáu tháng còn 3,32 triệu theo mẫu. Sidebar mobile vẫn điều hướng được.

`pnpm lint` còn 27 lỗi / 55 cảnh báo có sẵn ngoài Finance. Đây là kiểm tra bản demo, chưa phải nghiệm thu hệ thống quản lý tiền thật.

Đợt cập nhật component cùng ngày: đã cài và tùy chỉnh `@shadcn-dashboard/alert-06`, `tabs-05`; lint Finance và 13 bài kiểm tra vẫn qua, build thành công. Safari kiểm tra ảnh mục tiêu, tạo/mở lại mục tiêu với lựa chọn Du lịch, alert một hàng và tab mô phỏng đổi nội dung; tổng quan/mô phỏng được kiểm tra thêm ở viewport 393×768. Chưa kiểm tra chọn file ảnh riêng qua hộp thoại hệ điều hành. Lint toàn repo vẫn còn cùng 27 lỗi / 55 cảnh báo ngoài Finance.

Sửa tiếp: tab ngân sách được điều khiển bằng state khởi tạo `bars`, giữ hai panel mounted và ẩn panel không chọn; Safari kiểm tra đổi Radar rồi tải lại vẫn có nội dung So sánh hạn mức. Card mục tiêu dùng preview ảnh 152×104 ở lề phải phần tiêu đề (96×88 trên mobile); giữ hàng trạng thái và chiều cao các khối để số tiền, mức góp và footer thẳng nhau. Lint các file sửa và build qua. Đã làm mới cache `.next/dev` do Turbopack trả lại CSS cũ.

## Tham khảo

[Shadcn Dashboard components](https://shadcndashboard.dev/components), [shadcn Base UI Chart](https://ui.shadcn.com/docs/components/base/chart). Carousel dùng `embla-carousel-react`; không đổi preset hoặc sửa dashboard gốc.
