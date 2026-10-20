# Developer connections — nghiên cứu trước khi thiết kế UI

Ngày đối chiếu: **20/10/2026**, Asia/Ho_Chi_Minh. Trạng thái: nghiên cứu tài liệu và schema; chưa xác thực tài khoản hay triển khai kết nối.

## 1. Hiện trạng của dự án

Đã đọc `app/api/developer/route.ts`, `app/context/developer-context/index.tsx`, `lib/developer/model.ts`, `lib/developer/demo.ts`, `app/components/developer/shell.tsx` và kế hoạch `docs/AUTH_OWNER_DATABASE_BACKEND_PLAN.md`.

- `/api/developer` vẫn trả `developerDemo()`. Token, quota, contributions và số dòng thêm/xóa hiện chưa đến từ nhà cung cấp.
- Nút Nguồn dữ liệu chỉ xem danh sách. Chưa có callback, lưu credential, worker đồng bộ hay local collector cho Developer.
- Đăng nhập dashboard bằng GitHub trong kế hoạch auth là một mục đích riêng; không coi đó là đã cấp đủ quyền đọc repository hoặc Inbox.
- `Source.scope = personal/work/unconfirmed` chỉ là nhãn tổ chức nội bộ. Nhãn này không phải OAuth scope hay quyền API.
- `SNAPSHOT` đang cố định 16/10/2026. Khi nối thật phải dùng thời điểm đồng bộ và khoảng ngày thực tế; không tái sử dụng snapshot này làm “30 ngày qua”.

## 2. Các kênh tích hợp đã đối chiếu

### GitHub: định danh, repository và đóng góp

**GitHub App** phù hợp nhánh đọc repository: đăng ký app, khai báo quyền, người dùng cài đặt/chọn repository; server dùng installation token hoặc user token. Quyền user token bị giới hạn bởi cả người dùng và app. OAuth App là lựa chọn khác, dùng scopes. Installation token có vòng đời riêng; không trộn với session dashboard. [GitHub App và OAuth App](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/differences-between-github-apps-and-oauth-apps), [User access token](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app).

Lịch contributions có `contributionCalendar`, số commit/PR/issue/review và restricted counts qua GraphQL. Số đóng góp private không đồng nghĩa đọc được nội dung private. [GitHub GraphQL Users](https://docs.github.com/en/graphql/reference/users).

Số dòng lấy từ `GET /repos/{owner}/{repo}/commits/{ref}` → `stats.additions`, `stats.deletions`, `stats.total`. List/Get commits hỗ trợ GitHub App tokens và fine-grained PAT với `Contents: read`. [Commits REST API](https://docs.github.com/en/rest/commits/commits).

**Quy tắc đề xuất cho thẻ 30 ngày:**

- Chọn rõ tài khoản, repository, nhánh và cách quy commit cho tác giả; dùng SHA làm căn cứ đồng bộ.
- Mặc định thống kê commit của danh tính đã liên kết trong repository được chọn; xử lý merge/cherry-pick và nhiều email theo quy tắc công bố trước.
- `Tổng thay đổi = thêm + xóa`; thay đổi ròng là `thêm − xóa`, là chỉ số khác.
- Không suy ra số dòng từ contributions hoặc số commit; không cộng số dòng Claude Code vào số dòng GitHub vì có thể cùng một thay đổi.
- Khi hai kết nối cùng nhìn thấy một commit trong cùng repository, chỉ tính một lần. Fork/copy giữa repository cần chính sách riêng.

### GitHub Inbox: phải tách capability

Tài liệu Notifications hiện ghi **PAT classic**, scope `notifications` hoặc `repo`; không hỗ trợ GitHub App user/installation tokens hoặc fine-grained PAT. Poll theo `Last-Modified` và `X-Poll-Interval`. Vì vậy, GitHub App kết nối thành công chưa bật được Inbox cá nhân. [Notifications REST API](https://docs.github.com/en/rest/activity/notifications).

**Đề xuất:** làm phần repository trước; Inbox cần nhánh credential riêng hoặc để trạng thái chưa cấu hình. Nếu thay bằng danh sách PR cần review từ repository, phải đặt tên đúng, không gọi là toàn bộ GitHub Inbox. Không mặc định xin quyền `repo` rộng chỉ để có huy hiệu thông báo.

### OpenAI Platform API: usage và cost của API organization

Usage API dùng credential quản trị phù hợp; lấy token/request theo khoảng thời gian, model, project, API key hoặc user. `input_tokens` đã gồm cached/cache-write; không cộng cache lần nữa vào tổng input. Costs có endpoint riêng. Đây là dữ liệu API organization, không mặc định là usage của gói ChatGPT. [Usage completions](https://developers.openai.com/api/reference/resources/admin/subresources/organization/subresources/usage/methods/completions), [Costs](https://developers.openai.com/api/reference/resources/admin/subresources/organization/subresources/usage/methods/costs), [Administration](https://developers.openai.com/api/reference/administration/overview).

**Đề xuất:** loại kết nối riêng “OpenAI API organization”; kiểm tra quyền đọc usage/cost, không thử key bằng một model request gây phát sinh phí. Một API key gọi model được chưa chứng minh đọc được báo cáo organization. Không tính phần trăm gói Plus/Pro từ số token API.

### Codex với tài khoản ChatGPT: local App Server

Official protocol: JSON-RPC, mặc định stdio; `initialize` → `initialized`. Login qua `account/login/start`, nhận URL/mã rồi chờ kết quả. Đọc `account/read`, `account/rateLimits/read`, `account/usage/read`; có logout/cancel. Quota trả phần trăm đã dùng, thời lượng và reset; usage có summary/daily buckets, được phép null. [Codex App Server](https://learn.chatgpt.com/docs/app-server).

**Kiểm tra cục bộ không đăng nhập:** máy đang có `codex-cli 0.163.0`. Chạy `codex app-server generate-json-schema --out /tmp/developer-codex-schema`; schema có đủ bốn phương thức trên. Đây là bằng chứng protocol được cài, chưa phải bằng chứng tài khoản trả dữ liệu.

**Đề xuất:** web UI → backend/companion cục bộ → Codex. Nếu dashboard deploy lên cloud, server cloud không tự đọc được Codex trên laptop. Mỗi danh tính cần auth context tách biệt; không đăng nhập lại vào context đang dùng rồi coi cả Personal và Work vẫn đồng thời kết nối. Không hứa có toàn bộ lịch sử ChatGPT web hoặc phân rã model/input/output/cache chỉ từ daily total.

### ChatGPT workspace: analytics quản trị

Có nhánh Analytics API theo workspace, cần endpoint được bật và Admin key với scope phù hợp. Unified Daily Usage Analytics dùng `enterprise.analytics.usage.read`; không thay thế bằng scope Codex analytics. Compliance phục vụ audit, là hợp đồng khác. [Analytics API](https://learn.chatgpt.com/docs/enterprise/analytics-api), [Compliance API](https://learn.chatgpt.com/docs/enterprise/compliance-api).

**Đề xuất:** chỉ hiện thiết lập workspace khi người dùng thực sự có quyền/plan tương ứng. Chưa tìm được căn cứ để thiết kế OAuth consumer chung cho phép dashboard này đọc toàn bộ dữ liệu cá nhân ChatGPT.

### Apps SDK/MCP: chiều ủy quyền cần hiểu đúng

OAuth ở đây cho ChatGPT làm client truy cập **MCP server của ứng dụng chúng ta**. Nó không phải quyền cho dashboard đọc dữ liệu tài khoản ChatGPT. [Apps/Plugins authentication](https://developers.openai.com/plugins/build/auth).

### Claude: API, Code và Enterprise khác nhau

Anthropic không cho developer bên thứ ba cung cấp Claude.ai login trong app của mình hay dùng Free/Pro/Max credentials để chuyển tiếp yêu cầu cho người dùng. Không lấy token từ CLI/Keychain để tự xây luồng đăng nhập này. [Authentication and credential use](https://code.claude.com/docs/en/legal-and-compliance#authentication-and-credential-use).

Claude Platform có Usage/Cost Admin API cho organization; credential không đồng nghĩa key gọi Messages API thông thường. Admin API không dành cho individual accounts. Ngoài Admin key, tài liệu hiện có `org:admin` OAuth credential; đó là luồng quản trị Platform, không phải nút đăng nhập thuê bao Claude.ai. [Admin API](https://platform.claude.com/docs/en/manage-claude/admin-api), [Usage and Cost API](https://platform.claude.com/docs/en/manage-claude/usage-cost-api).

Claude Code Analytics có session, code thêm/xóa, commit, PR, tool actions và token/estimated cost theo model; là số liệu tổng hợp theo ngày cho tổ chức, không phải realtime. [Claude Code Analytics](https://platform.claude.com/docs/en/manage-claude/claude-code-analytics-api).

Claude Enterprise Analytics dùng **Analytics key** từ claude.ai, khác Admin key của Platform; có engagement và các báo cáo usage/cost theo điều kiện của plan. [Analytics APIs](https://platform.claude.com/docs/en/manage-claude/analytics-api).

### Claude Code local: nguồn telemetry

Claude Code có OpenTelemetry → OTLP collector qua HTTP/gRPC, nhận session/token/cost ước tính/code changes/commit/PR. Cấu hình tại môi trường chạy hoặc user/managed settings; không cần dashboard chiếm token đăng nhập Claude.ai. Telemetry content có các cờ opt-in riêng; mặc định không cần thu prompt, response hay source code để làm dashboard. [Monitoring](https://code.claude.com/docs/en/monitoring-usage).

**Đề xuất:** luồng UI “Thiết lập thu thập Claude Code”: chọn máy, cấp credential gửi telemetry riêng của dashboard, hướng dẫn cấu hình, chờ sự kiện đầu tiên. Không báo hoàn thành khi người dùng chỉ bấm sao chép cấu hình. Chỉ có lịch sử từ lúc collector bắt đầu nhận, trừ khi có nguồn backfill được xác nhận; telemetry không chứng minh quota thuê bao còn bao nhiêu.

## 3. Ma trận capability đề xuất cho sản phẩm

Đây là thiết kế suy ra từ nghiên cứu, chưa phải chức năng đã triển khai.

| Loại kết nối | Phương thức | Chỉ số được bật khi kiểm tra thành công | Không tự suy ra |
| --- | --- | --- | --- |
| GitHub repositories | GitHub App; tùy chọn fine-grained PAT | Repo, commit, PR, code changes theo phạm vi | Inbox cá nhân; toàn bộ repo công ty |
| GitHub notifications | PAT classic theo tài liệu hiện tại | Notifications, trạng thái đọc trong phạm vi cấp quyền | Toàn bộ nội dung repo private |
| OpenAI API organization | Credential quản trị đọc báo cáo | API tokens, requests, costs | Quota ChatGPT/Codex subscription |
| Codex local / ChatGPT auth | Companion + official App Server | Account, quota windows, usage trường có sẵn | Tất cả model breakdown hoặc chat history |
| ChatGPT workspace | Workspace Admin/Analytics contract | Chỉ số endpoint và workspace cho phép | Dữ liệu consumer hoặc workspace khác |
| Claude Platform | Admin/reporting credential | API usage và cost organization | Quota Pro/Max |
| Claude Code local | OTLP telemetry | Sessions, tokens, estimated cost, code changes | Lịch sử mọi máy hoặc quota tài khoản |
| Claude Code organization | Admin Analytics | Daily aggregates theo user/model | Realtime hoặc dữ liệu ngoài coverage |
| Claude Enterprise | Analytics key | Engagement/usage/cost đúng plan | Quyền dùng Platform Admin API |

## 4. Luồng UI cần có trước khi dựng

1. **Chọn nguồn dữ liệu**, rồi chọn mục đích: repository, notifications, API spending, Codex local, Claude Code telemetry hoặc workspace reporting.
2. **Chọn cách kết nối được hỗ trợ**, không cho tất cả provider cùng một form OAuth/API key.
3. **Chọn phạm vi**: account/organization/workspace/repositories/device. Nhãn Cá nhân/Công việc chỉ dùng để nhóm.
4. **Cấp quyền** ở nhà cung cấp hoặc cấu hình collector; form secret chỉ thuộc nhánh cần key.
5. **Xác minh độc lập** identity, permissions, transport và từng capability dữ liệu.
6. **Đồng bộ ban đầu**: hiển thị phạm vi ngày lấy được và phần còn thiếu.
7. **Quản lý**: xem trạng thái, lần thành công cuối, lỗi, scope thiếu; reconnect, rotate credential, pause sync, unlink. Xóa lịch sử là thao tác khác unlink.

Các trạng thái cần biểu diễn: chưa cấu hình; chờ cấp quyền; đang xác minh; chờ telemetry đầu tiên; đang đồng bộ; sẵn sàng; thiếu một phần quyền; mất kết nối máy; hết hạn/bị thu hồi; bị giới hạn tốc độ; chưa được provider hỗ trợ.

`null`/không hỗ trợ không được đổi thành `0`. Một nguồn không có cost vẫn có thể có token; key có lỗi cost không nhất thiết làm mất kết nối account. Không hardcode cửa sổ quota là 5 giờ/tuần nếu provider trả thời lượng khác.

## 5. Phân lớp đề xuất trong dự án

- View ở `app/components/developer/`; form dùng primitives Base UI và conventions hiện có.
- Context/SWR chỉ gọi Route Handlers của dashboard. Không gửi upstream secrets xuống client, localStorage hoặc URL.
- Service/adapter phía server tách theo **phương thức + sản phẩm**, không chỉ theo tên hãng.
- Domain gồm `Connection`, `CredentialReference`, `CapabilityStatus`, `SyncRun`, `MetricBucket`; UI chỉ nhận metadata đã lọc secret.
- Credential mã hóa phía server; refresh/callback xử lý phía server, xác minh state và PKCE theo flow provider hỗ trợ.
- Connector GitHub có backfill/pagination/cache và nhánh webhook xác minh chữ ký nếu dùng. Collector/local companion là tiến trình riêng, không giả làm browser có quyền đọc filesystem máy người dùng.
- Lưu provider account ID, workspace/org/device ID, coverage, timezone, observedAt, lastSuccessAt và adapter version; nhãn hiển thị không phải identity key.
- Duy trì lớp chuẩn hóa token riêng mỗi nguồn. Không ghép API usage, account daily totals và local session usage thành một tổng nếu chưa loại chồng lặp.

Các đề xuất bảo vệ credential là yêu cầu cho bước triển khai thật, không phải checklist bắt người dùng thao tác khi chỉ xem UI.

## 6. Thứ tự hợp lý để làm UI sau nghiên cứu

1. GitHub repository connection và kiểm tra quyền đọc; bổ sung thiết lập phạm vi cho thẻ code changes.
2. Codex companion với kiểm tra capability theo schema đang cài.
3. Claude Code telemetry setup với trạng thái chờ dữ liệu và phạm vi thiết bị.
4. Nhánh API organization/workspace reporting cho người dùng có quyền tương ứng.
5. GitHub Inbox là capability tùy chọn, không gắn điều kiện thành công vào GitHub App.

## 7. Giới hạn bằng chứng

Đã đọc tài liệu chính thức, tra cứu bổ sung SDK bằng Context7 và sinh schema Codex cục bộ. Chưa đăng ký GitHub App, nhập key/token, đăng nhập OAuth, gọi API trên tài khoản thật hoặc gửi telemetry. Vì vậy, protocol và phạm vi tài liệu đã được đối chiếu; quyền, plan, dữ liệu trả về và coverage thực tế vẫn phải xác minh ở bước tích hợp. Không thay đổi UI trong đợt nghiên cứu này.

## 8. UI đã triển khai sau nghiên cứu

- Route `/developer/connections`, có lối vào từ toolbar và sidebar; giữ tương thích `?panel=sources`.
- Catalog 9 loại nguồn; form metadata riêng, lựa chọn dữ liệu và phạm vi repository/device/organization.
- Quản lý thiết lập bằng context cấp layout: tạo, sửa, tạm dừng/tiếp tục, xem chi tiết và xóa có xác nhận.
- Mỗi capability giữ trạng thái chưa xác minh; lưu không tạo trạng thái connected. Kiểm tra trạng thái chỉ phản ánh thiết lập và việc chưa có xác nhận từ provider, không gọi upstream.
- Có hướng dẫn chính thức theo nguồn và cấu hình OTLP chỉ xuất metrics. Không có ô nhập key/token thật; không gửi cấu hình ra ngoài.
- Dữ liệu thiết lập chỉ giữ trong React state, qua điều hướng nội bộ Developer; reload đặt lại. Chưa có credential storage, callback OAuth, companion, collector hay worker đồng bộ. Không thay đổi số liệu Overview theo các thiết lập này.
- Tổ chức: `lib/developer/connections` cho types/catalog/validation; `app/context/developer-connections-context` cho state/actions; `app/components/developer/connections` cho màn hình, form, details và status.
