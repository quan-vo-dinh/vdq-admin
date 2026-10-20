# Notes

Route: `/apps/notes`.

- Tiêu đề riêng, nội dung rich text (Tiptap JSON), ngày giờ ghi chú GMT+7, màu sắc.
- Đậm, nghiêng, gạch chân/ngang, H1/H2, danh sách, trích dẫn, code, liên kết, hoàn tác/làm lại.
- Nhóm theo ngày, mới nhất trước; lọc hôm nay, 7 ngày hoặc ngày cụ thể; tìm cả tiêu đề và nội dung.
- Nút Lưu thay đổi; bản sửa chưa lưu được giữ khi đổi ghi chú trong cùng workspace, không giữ khi rời trang/tải lại.
- Tạo/cập nhật là thời điểm riêng với ngày giờ ghi chú; xóa có xác nhận.

Luồng dữ liệu: Route Handler `/api/notes` → NotesContext/SWR → danh sách và editor.
Dữ liệu API lưu trong bộ nhớ tiến trình, còn khi tải lại trang; mất khi server khởi động lại, chưa có database hay đồng bộ đa instance.

```sh
pnpm test:notes
pnpm dev
pnpm test:notes:api # server đang chạy ở localhost:3000
pnpm build
```

`NOTES_TEST_URL` thay địa chỉ server cho API test. API test chỉ tạo, sửa và xóa các ghi chú do nó tạo.
