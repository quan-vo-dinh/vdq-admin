# Personal Developer Workspace

Mở http://localhost:3000/developer hoặc **Developer → Góc làm việc developer** trong sidebar.

## Hai trang và hành vi

- `/developer`: bố cục từ Modern home (`StyleAwareWrapper`, `StyleDivider`, `DashboardCard`): header gọn, banner dữ liệu một dòng, chart/tóm tắt 7–5 cột, ba KPI, tab Contributions/Inbox bên dưới. Heatmap gộp/tách tài khoản, bảng Inbox lọc/sắp xếp/đánh dấu đọc.
- `/developer/ai`: cùng lưới 12 cột; bộ lọc provider/tài khoản/model, line + donut, quota riêng từng nguồn, tab bảng theo model/phiên. Tên model mở nguồn tham khảo; bỏ gallery model và chart lặp lại bảng.
- Báo cáo và Nguồn dữ liệu là dialog ở header; xuất `.txt` ngay trong dialog báo cáo. Sidebar chỉ còn hai trang.
- URL cũ `/developer/github` chuyển về Tổng quan; `/inbox` → `?view=inbox`, `/reports` → `?panel=reports`, `/sources` → `?panel=sources`. Chúng chỉ là redirect, không còn màn hình riêng.
- Logo SVG local có màu cố định: Claude cam, ChatGPT xanh lá, Codex xanh dương, GitHub tím. Biến thể màu dùng lại hình vector Lobe Icons; không dùng CSS mask theo màu chữ.

Dùng VI/EN và light/dark của shell hiện hữu. Trang chủ, Finance và Calendar giữ nguyên. Bộ lọc 1/7/30 ngày áp dụng analytics/báo cáo; heatmap là lịch năm, quota/Inbox là ảnh chụp tại mốc mẫu.

## Dữ liệu và giới hạn

`lib/developer/demo.ts` → `GET /api/developer` → `app/context/developer-context` (SWR + shared fetcher) → `app/components/developer`.

Server layout truyền cùng bộ mẫu ban đầu để các route render được dưới Next.js Instant Navigations. API chỉ GET, không có connector hoặc đồng bộ thật. Bộ mẫu cố định tại **16/10/2026 09:00 GMT+7**. Tải lại mẫu chỉ revalidate API; đánh dấu đọc và khoảng thời gian giữ trong Developer layout, mất khi tải lại trình duyệt/rời layout. Các bộ lọc riêng của từng trang đặt lại khi trang unmount.

- Hai nguồn Codex (personal/work), một nguồn Claude Code giả lập (không xác nhận số tài khoản Claude thật), hai GitHub mẫu. Claude chat chưa có dữ liệu.
- Token input/output/cache là các nhóm không chồng lặp trong fixture; đây không phải quy tắc chuẩn hóa mọi API provider.
- Quota độc lập từng nguồn, không cộng phần trăm. Quota work stale giữ số cũ và cảnh báo, không biến thành số hiện tại. Claude quota thiếu là `null`, không phải 0.
- Thông lượng model = tổng output của các phiên có thời gian / tổng giây sinh output của chính các phiên đó; không lấy trung bình các tốc độ. Loại trừ tool/wait. Thiếu timing hiển thị `—`; có số phiên được đo/tổng phiên. Toàn bộ số token và timing đều mock, không phải benchmark hoặc năng suất.
- Heatmap cộng contributionCount theo ngày/tài khoản, không tuyên bố khử trùng hoạt động giữa hai danh tính. Chỉ vẽ đến mốc mẫu; work thiếu private activity. Các loại commits/PR/issues/reviews trong fixture tương ứng tổng contribution để minh họa, không thay quy tắc GitHub thật.
- Inbox là thông báo giả lập; URL mở danh sách PR repository công khai và UI nói rõ không có PR/issue thật tương ứng. Mark read chỉ đổi frontend, không gọi GitHub.
- Báo cáo tổng hợp bằng quy tắc, không suy ra việc hoàn thành và không gọi mô hình AI trả phí. Chưa có chi phí API thật, lịch chạy nền hoặc dữ liệu đa thiết bị.

## Model và thư viện tham khảo

Danh mục có tên và ID model thật, kiểm tra từ nguồn chính thức đến **16/10/2026**; không phải danh sách quyền truy cập của tài khoản người dùng:

- OpenAI: GPT-6.1 Sol, GPT-6 Astra, GPT-6 Luna; GPT-6 Sol vẫn có để minh họa lịch sử. [Codex model catalog](https://learn.chatgpt.com/docs/models), [GPT-6.1 Sol](https://developers.openai.com/api/docs/models/gpt-6.1-sol).
- Anthropic: [Claude Fable 5.1](https://www.anthropic.com/claude-fable-and-mythos-5-1), [Opus 5.5](https://www.anthropic.com/claude-opus-5-5), [Sonnet 5.5](https://www.anthropic.com/claude-sonnet-5-5), [Haiku 5.5](https://www.anthropic.com/claude-haiku-5-5), đối chiếu [Models overview](https://platform.claude.com/docs/en/models/overview). Haiku 5.5 ra 07/10/2026; mock không tạo phiên trước ngày này. Mythos có quyền truy cập hạn chế nên không giả định có trong tài khoản mẫu.
- `modelCatalog.availableFrom` là ngày bắt đầu cho phép tạo fixture, **không phải bảng ngày phát hành đầy đủ**. Sol 6.1 và Claude mới có mốc chặn theo ngày công bố; các model đã tồn tại từ trước có thể lấy ngày đầu kỳ dữ liệu.
- Heatmap: [`grubersjoe/react-activity-calendar`](https://github.com/grubersjoe/react-activity-calendar), MIT, v3.2.1, custom data để hỗ trợ nhiều nguồn. Weekday/month labels VI/EN, theme theo app, click và Enter/Space xem ngày. SVG title dùng một chuỗi để tránh hydration mismatch khi trình duyệt parse các text node.
- Logo local Claude, Codex, ChatGPT/OpenAI, GitHub xuất từ [Lobe Icons](https://github.com/lobehub/lobe-icons) 6.0.0 (MIT); SVG và license ở `public/images/brands/`. Biến thể màu cố định trong SVG, giữ màu ở cả hai theme. Không cần runtime icon CDN hoặc dependency Lobe UI.
- UI tham khảo: [component catalog](https://shadcndashboard.dev/components), [radial](https://shadcndashboard.dev/components/radial-chart), [radar](https://shadcndashboard.dev/components/radar-chart), [pie](https://shadcndashboard.dev/components/pie-chart), [line](https://shadcndashboard.dev/components/line-chart), [tabs](https://shadcndashboard.dev/components/tabs). Dùng primitives có sẵn; không thay preset hoặc import cả block demo không liên quan.

## Kiểm tra

```bash
pnpm test:developer
pnpm exec eslint app/components/developer app/context/developer-context lib/developer app/api/developer 'app/(dashboard-layout)/developer'
pnpm build
pnpm lint
```

Đã xác minh bằng Safari desktop và responsive preview 393×768:

- Provider Claude Code đổi chart/bảng về bốn model Claude; logo local hiển thị theo theme.
- Heatmap gộp 2.363 contributions năm; riêng Personal 1.089; kỳ 7 ngày đổi 57 → 26. Dialog 16/10 có Personal 1 và Work 5.
- Đánh dấu đọc giảm Inbox 8 → 7; báo cáo sau điều hướng giữ 7. Tìm không khớp hiện Empty.
- Đổi VI/EN và 30 ngày cập nhật báo cáo; xuất tệp `developer-report-2026-10-16-30d.txt` thành công.
- Responsive navigation xuống dòng, chart model nằm trong khung, bảng rộng cuộn riêng; đã xem light và dark.
- Đã sửa chart quota bị global height 18rem ghi đè, border card bị style preset ghi đè và hydration SVG title. Reload trang GitHub sau sửa không còn hydration overlay.

Unit checks kiểm tra biên ngày, giao bộ lọc, tổng model/provider, thông lượng có trọng số và thiếu timing, contributions gộp, quota thiếu/stale, report. Lint toàn repo còn lỗi sẵn có ngoài module; translation entries trong language-context không thay logic effect vốn bị lint. Build vẫn có cảnh báo template về metadataBase và filesystem tracing ở `/api/code`. Chưa có nghiệm thu tích hợp thật hoặc thiết bị điện thoại vật lý.

## Cập nhật cô đọng giao diện — 17/10/2026

Gom sáu màn hình về hai trang và hai dialog, dựa trên source và giao diện thật của `/`. Bỏ phần mô tả dài trên shell, các chart/gallery lặp thông tin và bốn mục sidebar. Dữ liệu/công thức/nguồn model giữ nguyên mốc 16/10. Kiểm tra lại build, lint phạm vi Developer, bảy unit checks; lint toàn repo vẫn báo lỗi ngoài module. Đã kiểm tra trực tiếp logo màu, layout 7–5/ba KPI, tab Inbox, dialog nguồn/báo cáo và AI Usage trên Safari.
