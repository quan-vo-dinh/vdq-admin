# Rà soát CRUD và master data — 21/10/2026

## Cập nhật triển khai Finance sau rà soát

Đã bổ sung ở source/local: quản lý danh mục có danh sách/tìm/lọc/thêm/sửa/lưu
trữ/khôi phục/xóa chưa dùng; quản lý tài khoản có khôi phục/xóa chưa dùng;
khoản dự kiến có xác nhận xóa và báo lỗi; ngân sách có hạn mức mặc định, fixed,
điều chỉnh riêng từng tháng và bỏ override. API bảo vệ mã/loại/xóa danh mục mặc
định; nhãn ngân sách dùng tên danh mục để đổi tên không hiển thị sai lệch.
Không cần migration mới. Các hàng Finance bên dưới mô tả phát hiện ban đầu,
được thay thế bởi cập nhật này. Developer/Blog và các mở rộng khác vẫn giữ trạng
thái đã ghi; chưa chuyển thành tính năng production đầy đủ.

Kiểm tra: Finance unit 16/16, API master-data lifecycle PASS, web build và mobile
typecheck PASS, scoped ESLint sạch. Full lint còn 17 errors/43 warnings ngoài
phạm vi. Browser local: category create/edit/archive/restore/reload PASS;
account archive/restore PASS; budget default/month/reset smoke PASS. Chưa deploy
web hoặc build/cài lại APK cho thay đổi Finance này.

## Phạm vi và mức xác minh

Đối chiếu source hiện tại của các nhóm trang trên sidebar: Finance, Calendar,
Notes, Daily Learning, Developer, Profile và Blog. Kiểm tra UI → context → API →
repository/schema hiện có. Đây là rà soát source, không phải nghiệm thu thao tác
trên toàn bộ trang production/mobile. Không sửa dữ liệu người dùng hoặc deploy
trong lần rà soát này. Các màn hình demo primitives/icons/auth không được coi là
master data nghiệp vụ.

C = tạo, R = xem/danh sách, U = sửa, D = xóa. Lưu trữ và khôi phục là thao tác
riêng; không đánh dấu D hoàn tất chỉ vì có nút lưu trữ. HTTP method tồn tại không
đồng nghĩa người dùng có giao diện thực hiện hoặc luồng đã được kiểm thử.

## Ma trận hiện trạng

| Đối tượng/trang | UI hiện có | API/lưu trữ | Khoảng thiếu hoặc giới hạn |
| --- | --- | --- | --- |
| Finance — danh mục | C; xuất hiện trong chọn danh mục/bộ lọc | POST/PATCH/DELETE; overview trả danh mục; Supabase | Chưa có danh sách quản trị, sửa tên/mã/loại, lưu trữ, khôi phục, xóa từ UI. Import tạo mã mới nhưng tên ban đầu bằng mã, chưa có UI đổi tên. |
| Finance — tài khoản | C/R/U và lưu trữ | POST/PATCH/DELETE; Supabase | Không có khôi phục và xóa từ UI. Một số lỗi lưu trữ bị catch bỏ qua ở component, dù context có notice. |
| Finance — giao dịch | C/R/U/D, lọc, import/export CSV | Supabase; batch import nguyên tử | Có chuỗi CRUD trong source. Không suy ra toàn bộ thao tác đã nghiệm thu production/mobile. |
| Finance — khoản dự kiến | C/R/U/D trong dialog thiết lập | Supabase | Chưa có xác nhận xóa trong dialog hiện tại; catch lỗi xóa rỗng ở component. Đây là khoản dự kiến, không tự tạo giao dịch. |
| Finance — ngân sách | Xem và đặt/sửa hạn mức tháng | CRUD budgets và budget_months | Chưa có UI sửa hạn mức mặc định/đánh dấu cố định, hoặc xóa override để trở về mặc định. Không nên đồng nhất hạn mức 0 với xóa override. |
| Finance — mục tiêu | C/R/U/D; chỉnh phân bổ; thêm/xóa ảnh | Supabase + private media | Có luồng trong source. Không phải chuyển tiền thực. |
| Finance — ngày đầu kỳ | R/U | Một settings row cho owner | Không cần thao tác tạo/xóa settings như danh sách master data. |
| Finance — dòng tiền | Xem dự báo, chỉnh giả định | Giả định income/expenses/salaryDay/reserve trong useState; số dư/bills đọc backend | Chưa lưu bộ giả định/kịch bản sau reload. Đây là mô phỏng, không phải sổ giao dịch. |
| Calendar — sự kiện/công việc | C/R/U/D; kéo đổi lịch | Supabase, kiểm tra revision | Luồng CRUD tồn tại trong source. |
| Calendar — nhóm phân loại | Chọn/lọc nhóm có sẵn | Type union và validator cố định work/meeting/personal/learning | Chưa có master data nhóm lịch tùy biến. Màu/trạng thái/ưu tiên là lựa chọn hệ thống, không mặc định phải biến tất cả thành CRUD. |
| Calendar — thiết lập | R/U giờ làm việc, ngày làm việc, cách hiển thị | Supabase calendar_settings | Một cấu hình, không cần xóa như master data. |
| Notes — ghi chú | C/R/U/D; rich text, màu, ngày giờ | Supabase | CRUD có trong source; không có hệ thống notebook/tag master data hiện tại. Chưa có thùng rác/khôi phục sau xóa. |
| Learning — mục học | C/R/U, tạm dừng/học tiếp | Supabase habits, archived flag | Không có hard delete mục học. Đây là cách giữ lịch sử đã được cài đặt; cần mô tả rõ là lưu trữ thay vì gọi CRUD xóa đầy đủ. |
| Learning — điểm danh | Tạo/sửa/hoàn tác ngày đang thao tác | RPC check-in/undo, Supabase | Không coi báo cáo lịch sử đồng nghĩa có editor tùy ý cho mọi ngày; cần nghiệm thu riêng phạm vi ngày được phép sửa. |
| Profile — thông tin cá nhân/địa chỉ | R/U | Supabase profile, revision | Cấu hình một owner; không phải danh sách người dùng CRUD. Avatar/bio/workplace/education vẫn có nội dung từ lib/profile, chưa phải tất cả trường đều sửa được. |
| Preferences — ngôn ngữ/giao diện | R/U | Supabase user_preferences | Không cần C/D trên giao diện. |
| Developer — Connections | C/R/U/remove/pause trong UI | useState ở provider; không API lưu connection | Mất cấu hình khi provider remount/reload; check chỉ đặt timestamp, trạng thái vẫn là pending theo catalog. Chưa có kết nối/credential/telemetry thực. |
| Developer — overview/AI/GitHub/inbox | Xem, lọc, đánh dấu đã đọc | /api/developer trả developerDemo; readIds trong useState | Không phải dữ liệu đồng bộ thực; trạng thái đọc không bền sau reload. |
| Developer — feed | Đọc, chọn nguồn, tải thêm | API feed riêng; có chế độ demo chủ động | Feed đọc nguồn ngoài, không cần CRUD bài viết của nguồn. Không suy rộng dữ liệu thật của feed sang các trang Developer còn lại. |
| Blog — tạo/sửa/quản lý | Có form, bảng và nút | /api/blog đọc mảng mẫu; POST chỉ thêm comment vào mảng | Nút Add Blog/Save changes chưa nối lưu bài; publish/delete ở bảng thay đổi state cục bộ. Không có CRUD bài viết bền vững. |
| API template legacy userprofile/ticket | Có endpoints cũ | Mảng/module state | Không phải repository của Profile thật hoặc Daily Learning: route /apps/tickets hiện render LearningApp. Không dùng endpoints cũ làm bằng chứng tính năng mới đã lưu thật. |

## Những điều dễ bị bỏ sót khi hoàn thiện master data

1. Danh mục đã có giao dịch/ngân sách không được đổi code/kind theo guard hiện
   tại; vẫn có thể sửa tên. UI phải thể hiện rõ trường bị khóa và lý do, không
   gửi yêu cầu rồi chỉ hiện `invalid`.
2. FK owner+category/account đang bảo vệ lịch sử. Với dữ liệu đã được dùng, ưu
   tiên lưu trữ/khôi phục; chỉ cho xóa cứng bản ghi chưa được tham chiếu và có
   xác nhận. Lưu trữ không được làm biến mất báo cáo cũ.
3. `financeOverview` hiện tự bổ sung chín mã danh mục mặc định bị thiếu. Nếu xóa
   cứng một mã mặc định chưa được dùng, lần tải tiếp theo sẽ tạo lại. Cần định
   nghĩa chính sách trước khi thêm nút xóa; lưu trữ bản ghi hiện có không bị
   vòng seed này tạo trùng.
4. Ngân sách có name riêng và overview ưu tiên tên budget hơn tên category.
   Khi thêm đổi tên danh mục, cần chốt nguồn tên hiển thị thống nhất; nếu không,
   người dùng có thể thấy tên cũ trong ngân sách dù danh mục đã đổi tên.
5. Phân biệt lỗi validation, danh mục trùng, đang được dùng, revision conflict,
   mất quyền và schema chưa đồng bộ. Không dùng một thông báo `invalid` cho mọi
   nguyên nhân; không nuốt lỗi thao tác.
6. Master data phải có danh sách tìm/lọc active/archived, trạng thái trống,
   loading/error, validation và revision khi sửa/xóa/khôi phục. Form thêm đơn lẻ
   chưa đủ khả năng quản trị.
7. Không thêm trạng thái, tag, loại dữ liệu tùy ý chỉ để đủ số nút CRUD. Với enum
   hệ thống, việc mở rộng phải đồng bộ UI/type/validator/schema/import/report.

## Thứ tự khắc phục đề xuất

- Ưu tiên 1: hoàn thiện quản trị danh mục Finance (list/search/filter, sửa, lưu
  trữ/khôi phục, xóa bản ghi chưa dùng), chính sách mã mặc định và tên ngân sách.
- Ưu tiên 2: khôi phục/xóa tài khoản chưa dùng, xác nhận và phản hồi lỗi khoản dự
  kiến, chỉnh ngân sách mặc định/fixed và bỏ override tháng.
- Ưu tiên 3: bổ sung kiểm tra đối chiếu migration/API contract trước release để
  tránh lặp lại trường hợp UI mới chạy trên database cũ. Không tự migrate trong
  build; chỉ kiểm tra tương thích và báo rõ khi thiếu.
- Riêng Developer/Blog: hoặc giữ nhãn demo rõ và tách khỏi luồng dùng thật, hoặc
  chọn dự án triển khai persistence/integration riêng. Không thể coi việc thêm
  vài nút CRUD là hoàn thiện kết nối hoặc đồng bộ dữ liệu thật.
- Calendar nhóm tùy biến, Notes tags/notebooks, lưu kịch bản dòng tiền là các
  khả năng mở rộng chưa có; cần chốt nhu cầu trước khi thay model/schema.

## Bằng chứng source chính

- `app/components/finance/category-manager.tsx`: form chỉ POST categories.
- `app/components/finance/manage.tsx`: account/bill/settings controls.
- `app/components/finance/budgets.tsx`: chỉ ghi override hạn mức tháng từ UI.
- `lib/finance/server.ts`: resource CRUD, seed danh mục mặc định và tên ngân sách.
- `supabase/migrations/20261020000710_finance_category_invariants.sql`: guard
  code/kind khi có lịch sử; schema Finance chứa FK bảo vệ tham chiếu.
- `app/components/finance/cash-flow.tsx`: giả định dự báo dùng useState.
- `lib/calendar/server.ts`, `lib/calendar/types.ts`,
  `lib/calendar/validation.ts`: lưu sự kiện/cấu hình; loại nhóm cố định.
- `lib/notes/server.ts`, `app/components/apps/notes/notes-list.tsx`: CRUD thật.
- `lib/learning/server.ts`, `app/components/apps/learning/habit-list.tsx`:
  lưu trữ/học tiếp; check-in RPC.
- `lib/personal/server.ts`, `app/components/user-profile/index.tsx`:
  trường profile lưu thật và nội dung tĩnh còn lại.
- `app/context/developer-connections-context/index.tsx`: connections chỉ useState.
- `app/api/developer/route.ts`, `app/context/developer-context/index.tsx`:
  developerDemo và trạng thái đọc trong phiên.
- `app/api/developer/feed/route.ts`: nguồn feed riêng.
- `app/api/blog/route.ts`, `app/(dashboard-layout)/apps/blog/create/page.tsx`,
  `app/(dashboard-layout)/apps/blog/edit/page.tsx`,
  `app/components/apps/blog/blogtable/manage-blogtable.tsx`: form và hành động
  Blog chưa nối repository bài viết bền vững.

## Tiêu chí đóng một khoảng thiếu

Cho từng entity, kiểm tra UI → API → DB → reload, sửa/xóa với revision cũ, ràng
buộc tham chiếu, lịch sử sau lưu trữ, khôi phục, thông báo lỗi và layout web/mobile.
Migration đã áp dụng chỉ xác nhận schema tương ứng đã có; test build/API không
thay thế thao tác trình duyệt. Báo cáo này không đánh dấu các khoảng thiếu đã sửa.
