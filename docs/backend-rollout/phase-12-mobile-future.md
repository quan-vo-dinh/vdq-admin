# P12 — Chuyển toàn bộ dashboard sang Web + Android bằng Capacitor

**Quyết định cập nhật ngày 21/10/2026:** chọn Capacitor, dùng chung frontend cho web và APK Android. Thay thế kế hoạch cũ “PWA trước, TWA khi cần”.
**Trạng thái:** đã chốt hướng và viết kế hoạch; chưa cài Capacitor, chưa có Android project/APK, chưa nghiệm thu mobile. Lượt này chỉ sửa tài liệu, không cho phép suy ra rằng đã triển khai.

## 1. Kết quả cuối cùng và phạm vi

- Toàn bộ dashboard người dùng đang sử dụng có mặt trên web và APK, cùng chức năng và cùng dữ liệu backend. Không kết thúc phase bằng demo một màn hình hoặc một module Finance.
- Một nguồn component, theme và logic nghiệp vụ dùng chung; có hai điểm khởi chạy/build theo nền tảng. Không yêu cầu hai bộ UI độc lập hoặc repository mobile riêng.
- Android có icon, splash, back navigation, keyboard/safe-area, chọn/lưu/chia sẻ file phù hợp thiết bị. Các màn hình phải thích ứng mobile, không chỉ thu nhỏ desktop.
- APK chứa HTML/CSS/JS đã build, chạy trong Android WebView. API, Auth và Supabase tiếp tục trên server. Không dùng `server.url` trỏ website production để thay cho việc đóng gói frontend.
- Cùng mức chức năng **đang có**, không biến dữ liệu mock/provider chưa kết nối thành live. Không tạo backend mới cho Blog/Developer demo chỉ để hoàn tất mobile.
- Giữ các ràng buộc hiện có: một owner, RLS/private media, expectedRevision, VND nguyên, múi giờ Việt Nam và bảo toàn dữ liệu.
- Không đưa `/today`, Quick Note/priorities/Activity kiểu Today trở lại. Route/auth/template không còn được dùng không tự biến thành tính năng mới.

Ngoài phạm vi: Expo/React Native/Flutter/TWA, iOS hoặc desktop installer; Google Play/AAB, paid cloud build/OTA; push/background sync mới; offline-first nhiều thiết bị. Những phần này không phải điều kiện để hoàn tất toàn bộ chức năng web hiện tại trên Android.

“Độc lập” ở đây là có bộ cài và frontend trong APK, không cần mở Chrome thủ công. Không có nghĩa database/backend chạy trong điện thoại hoặc mọi thao tác hoạt động khi mất mạng.

## 2. Hiện trạng đã khảo sát và tác động chuyển đổi

| Hiện trạng trong repository | Tác động và hướng xử lý |
| --- | --- |
| `app/(dashboard-layout)/**/page.tsx`, layout và `proxy.ts` dùng Next App Router/Cache Components | Giữ web Next; Android có router/shell riêng nhưng gọi cùng feature views. Không phụ thuộc DOM Activity của Next ở mobile |
| `app/components/**`, `components/ui/**`, Tailwind v4, Base UI/shadcn, SWR/context | Tận dụng; chỉ sửa chỗ phụ thuộc nền tảng. Không thay design system hoặc state library toàn app |
| `next/link`, `next/navigation`, `next/image` trong shell/Notes/Finance và các component khác | Tạo adapter navigation/image ở ranh giới; Android không import runtime Next. Tách phần đọc search params khỏi view nếu cần |
| `app/api/global-fetcher.ts` và các context còn gọi trực tiếp `fetch('/api/...')` | Một API transport dùng chung, resolve base URL, auth headers, errors, multipart/download. Rà cả fetch ngoài global fetcher |
| `lib/supabase/server.ts`, `lib/auth/owner.ts`, `lib/auth/api.ts` dựa cookie SSR/Origin | Thêm transport bearer cho mobile ở API, giữ nguyên bảo vệ cookie cho web; xác minh owner giống nhau |
| `lib/auth/env-credentials.ts`, `owner-session.ts`, `POST /api/auth/credentials` | Tài khoản/hash vẫn trong env server; tách phát hành session khỏi cookie để cấp phiên cho mobile an toàn |
| GitHub OAuth hiện có | Mobile phải mở system browser và quay về app đúng flow; không nhúng trang đăng nhập GitHub vào WebView |
| Tiptap, Recharts, CSV Blob/download, goal upload, bookmarks/local preferences | Kiểm tra tương thích và lifecycle. File/URL/storage dùng adapter thay vì giả định DOM desktop |
| Profile/Finance đã sửa URL normalization, ngày ghi bù và migration `20261021000100` | Giữ các bản sửa trên cả hai nền tảng; không áp lại giới hạn cũ khi chuyển UI |

Trạng thái cloud/P11 dùng evidence mới nhất, không dùng các đoạn “chưa deploy” lịch sử. Web hiện đã production; P11 vẫn có mục nghiệm thu riêng chưa đóng. P12 không tự đánh dấu P11 PASS.

## 3. Kiến trúc đã chọn

### 3.1 Hai entry point, một nền tảng frontend

- **Web:** Next.js hiện tại tiếp tục phục vụ domain production, server rendering, Route Handlers và web auth.
- **Android:** React + Vite build ra static assets, Capacitor nhúng assets vào APK; React Router điều phối các đường dẫn tương đương web.
- **Dùng chung:** feature views, UI primitives, SWR/context nghiệp vụ, model/validation/formatting, theme/i18n và API DTO.
- **Khác theo nền tảng:** router, ảnh tối ưu, API authentication, secure storage, filesystem/share, external links, lifecycle/back/keyboard.
- **Backend:** Next Route Handlers + Supabase Auth/Postgres/Storage hiện có; không dựng backend thứ hai hoặc database thứ hai cho Android.

Không đổi root Next sang `output: 'export'`: điều đó sẽ làm mất backend/SSR/auth hiện có. Mobile có pipeline build static riêng.

### 3.2 Bố trí mã nguồn dự kiến

```text
app/(dashboard-layout)/       Next route/layout wrappers cho web
app/api/                     Backend dùng chung cho web + mobile
app/components/              Feature UI dùng chung sau khi tách import Next
app/context/                 Domain state/SWR dùng chung
components/ui/               Design system hiện tại
lib/platform/                Hợp đồng adapter và implementation web
lib/api/                     Transport/DTO/error handling dùng chung
lib/auth/, lib/supabase/      Server auth + backend, không import vào mobile
mobile/                      React entry, routes, platform providers, cấu hình Vite/Capacitor
mobile/android/              Native Android sources, Gradle wrapper
```

Các đường dẫn mới là thiết kế mục tiêu, chưa tồn tại. Giữ package manager pnpm/lockfile hiện có; chưa cần chuyển toàn repo thành monorepo/Nx. Nếu công cụ buộc cần package con thì dùng pnpm workspace nhỏ và ghi quyết định, không nhân đôi lockfile/UI. Feature cần chuyển khỏi `app/` chỉ di chuyển có mục tiêu, cập nhật import từng phần.

### 3.3 Hợp đồng nền tảng

| Adapter | Web | Android |
| --- | --- | --- |
| Navigation | Next Link/router/path/search | React Router + app links/back; cùng canonical path/param |
| API | Relative `/api`, cookie same-origin | HTTPS API base tường minh + owner bearer |
| Images | Next Image nơi phù hợp | `img`/asset loader, lazy loading/fallback; private URL vẫn ngắn hạn |
| Credentials/session | Cookie Supabase SSR | Access token trong bộ nhớ; refresh token trong secure storage |
| Files | File input, Blob, download | Android picker/filesystem/share; convert sang cùng upload/CSV contract |
| External links | Browser link | System browser; không để URL bên ngoài chiếm app WebView |
| Lifecycle | Focus/visibility | App resume/network/back/keyboard; cleanup listener rõ ràng |

Views không gọi plugin rải rác. Adapter phải có implementation/fallback rõ; không import `server-only`, `next/headers`, secrets hay server repositories vào bundle mobile.

## 4. Auth, API và bảo toàn dữ liệu

### 4.1 Đăng nhập cá nhân từ env

1. Giữ username và hash trong private env backend, không chuyển mật khẩu/hash/key phát hành session vào APK hoặc biến `VITE_*`.
2. Tách phần kiểm tra credentials + phát hành owner session thành service server dùng lại; web adapter đặt cookie như hiện tại.
3. Thêm endpoint mobile versioned, ví dụ `/api/mobile/v1/auth/credentials`. Sau xác minh password, session issuance và `assert_owner` thành công mới trả Supabase access/refresh token qua HTTPS, `private, no-store`.
4. Kiểm tra đúng UUID owner + GitHub identity + enabled registry như hiện tại. Không tạo user mới, không dùng JWT tự ký hoặc admin token thay cho phiên user.
5. Rate limit bền vững cho mọi instance trước khi public mobile grant: ưu tiên gateway có quota phù hợp; nếu không có, dùng cơ chế nhỏ trên backend/DB, không chỉ bộ đếm process. Giới hạn body, thời gian, concurrency và thử sai.
6. Refresh phải single-flight, xoay token và ghi secure storage nguyên tử; xử lý token cũ sau process kill. Logout xóa bộ nhớ/secure token/cache private và thu hồi refresh session; access JWT có thể còn hạn, không hứa revocation tức thì khi chưa có cơ chế đó.

### 4.2 GitHub OAuth và deep link

- Giữ đăng nhập GitHub như chức năng hiện có, không âm thầm bỏ khỏi Android.
- Dùng system browser, PKCE/state và callback đã đăng ký; ưu tiên verified HTTPS Android App Links cho domain sở hữu. App ID/signature quyết định `assetlinks.json` cho **App Links**, không phải TWA.
- Endpoint callback/exchange mới tách với callback web. Nếu đi qua backend, chỉ chuyển code một lần, hạn ngắn, ràng buộc PKCE/state; không đưa access/refresh token trong URL/log.
- Test app đang mở, cold start, hủy consent, back, callback lặp hoặc sai host/path/state. Không mở signup/manual linking để né lỗi.
- P12A phải ghi sequence cụ thể theo SDK/provider thực tế rồi mới code; chưa quyết định tùy tiện callback scheme cuối cùng trong tài liệu này.

### 4.3 Authorization và CORS

- `requireOwner` nhận một client auth đã được xác minh: web dùng cookie, mobile dùng user JWT với publishable key; cả hai phải qua `getUser`/registry/identity và RLS.
- Mọi nơi gọi `requireOwner()` trực tiếp (ngoài wrapper `withOwner`) phải nhận request auth context; tránh wrapper kiểm tra bearer nhưng repository lại đọc cookie rỗng.
- Bearer sai/hết hạn bị từ chối; không fallback cookie khi Authorization không hợp lệ. Cookie web vẫn giữ kiểm tra Origin/CSRF hiện có.
- API thêm CORS chính xác cho origin WebView đã cấu hình/test (Android HTTPS localhost theo cấu hình mục tiêu), methods/headers cần thiết; OPTIONS và error response nhất quán, `Vary: Origin, Cookie, Authorization` phù hợp. Không `*` với credentials, không cho `null`/mọi localhost tùy ý.
- Origin, app ID hay API key public không chứng minh owner. CORS không thay thế token verification; native HTTP không dùng để bỏ kiểm tra quyền.
- Giữ một backend contract cho CRUD, không sao chép business rules. DTO tiền dạng text, expectedRevision, idempotent CSV, lỗi 409 và private media giữ nguyên.

### 4.4 Lưu trữ và môi trường

- Chọn secure-storage plugin có Android Keystore/encryption, license phù hợp, còn được bảo trì và tương thích Capacitor major đã pin. Nếu không đạt thì viết adapter native nhỏ; không lưu refresh token trong `localStorage` hay Preferences thuần để gọi là secure.
- APK chỉ nhận API base, publishable config thực sự cần và build metadata. `.env.local` chứa secrets của Next không được copy/import vào mobile; kiểm tra cả sourcemap, Gradle assets và APK giải nén.
- Debug dùng backend local/dev với URL mà thiết bị truy cập được; không mở port/dev API public. Emulator localhost khác máy host; cấu hình riêng có kiểm tra.
- Release dùng HTTPS production; preview/local không tự fallback production. Không đổi owner local thành owner production.
- Dữ liệu private đã cache phải rõ chủ sở hữu; logout không để người sau đọc lại. Bookmark chỉ lưu trên một thiết bị vẫn là local nếu backend chưa có sync, không quảng cáo đồng bộ toàn bộ.

## 5. Ma trận phạm vi toàn ứng dụng

Mỗi dòng phải có web + Android acceptance; “đã chạy một dòng” không thay cho các dòng còn lại. P12A rà sidebar, route graph và mọi internal link để bổ sung route alias/dynamic còn thiếu.

| Nhóm/route | Phần phải chuyển và kiểm tra | Trạng thái dữ liệu phải giữ |
| --- | --- | --- |
| `/`, `/developer` | Root redirect, shell, tổng quan, charts, inbox và dialog | Demo/provider nào chưa live vẫn ghi đúng |
| `/developer/ai`, `/connections`, `/inbox`, `/github`, `/reports`, `/sources` | Tabs, filters, reports, connect/external link, route alias | Không tạo kết nối giả hoặc backend ngoài phạm vi |
| `/developer/feed` | Feed thật, cover/fallback, source/filter/search, pagination/refresh/backoff, bookmark, mở bài ngoài app | daily.dev token chỉ ở server; bookmark local giữ đúng phạm vi |
| `/finance` | Dashboard, month input tự do, charts/tabs, account/bill management | Owner/RLS, VND và forecast semantics |
| `/finance/transactions` | Tạo/sửa/xóa, backfill, filters/table, CSV import/export, conflict | Giao dịch quá khứ hợp lệ; actual tương lai vẫn bị chặn |
| `/finance/budgets` | Month override, edit, chart/radar | Không ghi đè tháng khác |
| `/finance/goals` | CRUD, phân bổ, deadline cũ, picker/private image upload/preview | Upload fail giữ ảnh cũ, MIME/size/CAS và signed URL |
| `/finance/cash-flow` | Giả định, ngày dự báo, chart/calendar | Simulation không tự thành giao dịch |
| `/apps/calendar` | Các view, tạo/sửa/xóa, timed/all-day, repeat/settings đang có | Timezone VN, end-exclusive; không nảy khóa cuộn |
| `/apps/notes` | List, search, Tiptap toolbar/editor, autosave/manual save đang có, delete | Keyboard/selection/unsaved draft; lỗi phải báo chưa lưu |
| `/apps/tickets` | Learning habits/check-in/undo/history/archive và luồng tạo đang được expose | Một check-in/ngày VN, archive/undo conflict |
| `/pages/user-profile` | Personal/address, links normalization, theme/locale, toàn bộ dialog | Save/reload thật, draft và revision |
| `/apps/blog/**` | Listing/detail slug, create/edit/manage, rich text/media/filter đang có | Giữ demo/hosted API disabled tương ứng, không hứa lưu thật |
| Auth và trang template đang expose | Login hai phương thức, logout/session expired; form/table/icon pages nếu reachable | Trang auth mẫu không cấp quyền hay mở signup thật |
| Dùng chung | Sidebar/header/tabs, dialogs/menus/popovers, error/loading/offline, external links | Cùng theme, cỡ chữ, a11y và trạng thái không giả |

Không cần port các `page.tsx` nội bộ của layout thành route người dùng. Route cũ redirect/alias phải tới đúng màn hình; không clone chúng thành module mới.

## 6. Trình tự triển khai và gate từng bước

Các bước dưới là chia nhỏ công việc kỹ thuật, **không giảm phạm vi bàn giao cuối**. Không tuyên bố P12 xong khi chỉ có APK shell.

| Bước | Việc cần làm | Đầu ra và điều kiện chuyển bước |
| --- | --- | --- |
| **12A — Inventory/contract/toolchain** | Chốt route matrix; rà Next imports, tất cả fetch/file/storage; đo baseline; xác minh Android Studio/SDK/JDK/Capacitor/Vite/TS7/pnpm tương thích; chốt auth sequence | Inventory có owner cho từng phụ thuộc, version matrix và baseline. Khóa version thực tế trong lockfile; chưa sửa Node22 web theo thói quen |
| **12B — Shared frontend/platform adapters** | Tách view khỏi Next wrappers, navigation/image/transport; shared shell/theme/context; thêm mobile React entry/router/Vite | Web build/tests giữ qua, mobile static build không chứa Next/server-only; toàn route có mapping và adapter coverage |
| **12C — Mobile auth/API** | Credentials grant, owner bearer context xuyên wrapper/repository, secure session/refresh/logout, GitHub browser callback, CORS | Contract/security tests cookie và bearer, real owner/non-owner, refresh/cancel/replay. Không fallback mock/admin CRUD |
| **12D — Toàn bộ feature parity** | Chuyển đủ ma trận mục 5; file/CSV/private media; giữ errors/conflict/data mode | Checklist từng thao tác web/Android, không còn route chung mở bằng remote website để lấp thiếu màn hình |
| **12E — Android behavior/performance** | Safe area, keyboard, Back, app links, resume/offline, tablet/font scale, tối ưu chart/editor/list/image | Test thiết bị thật, số đo cold/warm/interaction/memory; không chỉ ảnh emulator/build PASS |
| **12F — Package/release/rollback** | Native project, signing, release build/scan, install-update test, release notes/checksum, compatible backend rollout | APK release thật đủ toàn app, web regression pass, artifact/cách cài/rollback và evidence hoàn chỉnh |

Dependencies: 12A → 12B → 12C; 12D triển khai trên nền 12B/12C; 12E/12F kiểm tra **toàn bộ**, không chỉ flow đầu tiên. Có thể chạy test sớm trong từng bước nhưng không giảm gate cuối.

### Công cụ và scripts dự kiến

- Capacitor major 8 là ứng viên theo tài liệu hiện tại; `core`, `android`, CLI và plugins phải tương thích cùng major. Chốt patch cụ thể ở 12A sau kiểm tra thực tế.
- Dùng Node22/pnpm hiện có nếu đúng compatibility; Android Studio/JDK/SDK/Gradle wrapper pin theo Capacitor template, không đoán minSdk/targetSdk từ hướng dẫn cũ.
- Scripts dự kiến: `mobile:dev`, `mobile:build`, `mobile:sync`, `android:debug`, `android:release`, `test:mobile-contracts`; chưa tồn tại, tạo khi thực thi. Release build luôn build frontend mới rồi sync, tránh APK chứa assets cũ.
- Vercel ignore phải loại mobile native build/cache/keystore/APK và Android-only tooling; local backup/source archive cũng loại secrets/outputs. Không phá `.pnpmfile.cjs` hay lockfile web.
- Không thêm Ionic UI chỉ vì dùng Capacitor. Plugin dự kiến App, Browser, Keyboard, Network, Filesystem, Share; chọn thêm System Bars/Splash theo nhu cầu. Không tự thêm camera permission/push/background runner khi chức năng hiện có không cần.

## 7. Trải nghiệm Android bắt buộc

- Back đóng lớp overlay đang mở trước, rồi quay lịch sử; root có hành vi thoát rõ, không vòng lặp redirect. Không nhân đôi handler giữa shell và dialog.
- Menu/dialog đóng khi điều hướng; rời Calendar phải cuộn được trang khác. Route restore, keyboard mở/đóng không để `overflow:hidden` bị kẹt.
- Status/navigation bars và safe-area không đè nội dung; gesture navigation và font scale lớn vẫn thao tác được.
- Form/date/month picker cho ghi bù theo business rules mới. Không thu nhỏ text hoặc khóa zoom chỉ để hết overflow.
- Tiptap focus/selection/toolbar, IME tiếng Việt và scroll-to-input phải dùng được. Bảng rộng dùng scroll trong bảng hoặc bố cục mobile, không gây tràn cả viewport.
- External article/social links mở system browser; return/resume giữ vị trí và bản nháp. Link/token/callback không đi tùy ý tới domain khác.
- CSV chọn file, preview, import, export/save/share hoạt động trên Android thật. Không coi Blob URL desktop là bằng chứng Android download đã chạy.
- Goal image picker/cancel/rotate/large file/invalid MIME, upload/preview/reload và signed URL hết hạn đều có kiểm tra.
- Resume revalidate có giới hạn, không bắn hàng loạt request/refresh token; không đánh dấu mọi form là đã lưu khi quay lại app.

## 8. Offline và hiệu năng trên máy không mạnh

### Offline trong P12

Frontend đã đóng gói vẫn có thể mở shell; dữ liệu chưa có không được thay bằng 0/demo. Mất mạng hiển thị đúng trạng thái. Form đang sửa giữ bản nháp trong phiên; nếu cần phục hồi sau process kill, phải chọn kho lưu mã hóa và đặt thời hạn/xóa theo user, không âm thầm persist nội dung nhạy cảm vào Preferences.

Không hứa save offline. Mutation lỗi giữ draft và cho thử lại có kiểm tra conflict; không tự gửi lại POST tạo bản ghi trùng sau resume. Không có outbox/sync queue hoặc guaranteed background work trong phase này.

### Mục tiêu đo và chấp nhận

- Chốt một máy Android thực có cấu hình vừa/yếu: model, RAM, Android/WebView, mức pin/nhiệt, mạng, dữ liệu mẫu cùng cỡ dữ liệu thực. Emulator không thay cho gate này.
- Đo release build (không dùng debug để kết luận): cold start tới shell, warm resume, chuyển trang, mở dialog, scroll feed, charts Finance, typing Notes, picker/upload và APK size.
- **Budget đề xuất, chưa phải kết quả đo:** cold shell p95 ≤3 giây, warm resume tới shell ≤1 giây, phản hồi UI cục bộ p95 ≤100ms; tách thời gian API/mạng khỏi thao tác UI. Chốt budget với baseline 12A trước tối ưu, ghi lý do nếu điều chỉnh, không âm thầm hạ ngưỡng.
- Ghi số liệu tối thiểu 20 lượt cho cold/warm và tương tác chính; quan sát scroll trace, long task/jank, memory qua chuỗi 30 lần đổi route/dialog. Không ANR/crash hoặc tăng bộ nhớ không hồi phục theo vòng lặp.
- Tối ưu theo trace: lazy route/chart/editor, phân trang/virtualization khi cần, image size/lazy/fallback, giảm animation full-screen/blur/shadow nặng, dừng observers/polling khi background.
- Không cắt chức năng để đạt số đo; có thể đổi cách hiển thị mobile, giảm chuyển động và chỉ tải nội dung khi cần. Capacitor/WebView không bảo đảm 60fps chỉ nhờ đổi gói cài.

## 9. Kiểm thử, artifact và nghiệm thu cuối

### Các lớp kiểm tra

1. Build/typecheck/lint phần sửa cho web và mobile; báo riêng baseline lint toàn repo nếu còn.
2. Unit/contract: platform routing/API URL, token refresh/logout, errors, timezones, money DTO và CSV. Import graph/bundle scan chặn server secrets/Next server runtime.
3. API: owner cookie + bearer parity, token forged/expired/non-owner, Origin/CORS/preflight, CSRF web, revision conflict, private media và hosted feature gates.
4. Browser: desktop + responsive web, auth hai cách, route/back/scroll, modal, toàn module ở mục 5.
5. Android thiết bị thật: cài debug để dev; release để nghiệm thu; cold/resume/process kill/offline, auth hai cách, đủ feature matrix và file flows.
6. Cross-device: tạo/sửa/read dữ liệu thật trên web rồi Android và ngược lại; hai thiết bị sửa cùng revision phải có 409, không last-write-wins giả. Dữ liệu local-only kiểm tra đúng giới hạn, không gọi là sync.
7. Update: cài đè APK cùng signing key/versionCode tăng giữ session/dữ liệu hợp lệ; backend mới phục vụ được APK phiên bản trước trong khoảng tương thích công bố. Uninstall có thể xóa local data; dữ liệu server vẫn còn.

### Điều kiện P12 PASS

- [ ] Một release APK đủ toàn bộ route/flow thuộc phạm vi, cài được trên máy đã chốt.
- [ ] Web production giữ chức năng, owner guard, theme/typography và dữ liệu.
- [ ] Credentials + GitHub, refresh/logout, process restart hoạt động; không lộ secrets/token/private cache.
- [ ] Module matrix không có mục bị bỏ bằng câu “sẽ làm sau” hoặc dùng remote website thay màn hình thiếu.
- [ ] Finance backfill/month selection, Profile save, Calendar scroll, Notes IME, CSV và private image picker đã kiểm trên thiết bị.
- [ ] Kết quả performance theo budget chốt, trạng thái offline trung thực, không saved giả.
- [ ] APK/versionCode/signature/checksum, backend release và migration versions được ghi; file hướng dẫn cài/cập nhật/backup khóa có đủ.
- [ ] Cleanup chỉ smoke records nhận diện được, không sửa/xóa dữ liệu thật; evidence có scope, thiết bị và hạn chế còn lại.

Không có thiết bị hoặc quyền UI thì ghi rõ chưa PASS phần đó; không dùng cookie giả/alternate browser để bypass. Build hoặc API test không thay thế visual/native acceptance.

## 10. Phát hành và rollback

- Triển khai backend hỗ trợ bearer theo cách additive trước, giữ API cookie web. Sau contract tests mới phân phối APK. Lượt viết plan này không deploy/migrate/cài SDK hoặc tạo signing key.
- Cùng repo có thể có hai pipeline build; web lên Vercel, APK là artifact ký riêng. Release đầu không cần paid CI, store account hoặc OTA.
- Keystore/password ở ngoài Git, chỉ user quản lý; Android app ID và signing certificate không đổi tùy tiện. Không dùng debug key làm release cuối.
- Backend contract có version/min-supported-app rõ khi cần; chưa chặn APK cũ bằng cơ chế update bắt buộc nếu chưa có migration tương ứng. Web deploy không tự cập nhật JS đã đóng gói trong APK.
- Rollback backend về bản tương thích + phát hành APK sửa với versionCode cao hơn; Android thường không cho cài hạ version trực tiếp. Không gỡ app để rollback nếu cần giữ local draft, không reset Supabase/database.
- Nếu cần hot update sau này, đánh giá signing/security/compatibility riêng; không tự thêm dịch vụ OTA.

## 11. Đầu vào user cần cung cấp khi thực thi

Xem [U12](USER_SETUP.md#u12--web--android-capacitor): tên/icon, applicationId, thiết bị Android, phân phối APK nội bộ, signing-key ownership/backup và consent tài khoản. Dùng thông tin sẵn có trước; chỉ hỏi phần thật sự thiếu, không hỏi lại quyết định Capacitor/toàn app.

P12A phải ghi phần nào đã xác minh và phần nào cần quyết định (secure-storage plugin, SDK versions, OAuth callback cụ thể, thiết bị/budget). Đây là quyết định kỹ thuật cần hoàn tất trong triển khai, không phải giấy phép bỏ bớt module.

## 12. Tài liệu chính thức đã đối chiếu

- [Capacitor installation/local web bundle](https://capacitorjs.com/docs/getting-started)
- [Capacitor config: webDir, Android origin, server.url chỉ cho live reload](https://capacitorjs.com/docs/config)
- [Node/Android Studio/SDK requirements](https://capacitorjs.com/docs/getting-started/environment-setup)
- [App lifecycle/back/appUrlOpen](https://capacitorjs.com/docs/apis/app)
- [Filesystem](https://capacitorjs.com/docs/apis/filesystem), [Share](https://capacitorjs.com/docs/apis/share), [Preferences](https://capacitorjs.com/docs/apis/preferences)
- [Supabase native mobile deep linking](https://supabase.com/docs/guides/auth/native-mobile-deep-linking)

Các mốc major/toolchain phải được kiểm lại ở 12A; không sao chép snippet auth callback hoặc SDK version thiếu kiểm chứng vào production.

## 13. Cập nhật thực thi 21/10/2026

Trạng thái hiện tại **IN PROGRESS**, thay cho dòng planned/chưa triển khai đầu tài liệu. Đã triển khai shared platform/API adapters, React/Vite route entry, Capacitor8/Android project, bearer owner context, secure vault/refresh/logout và PKCE callback preparation. Web/mobile build, debug và unsigned release APK build PASS local. [Evidence P12](evidence/P12.md) là nguồn trạng thái từng12A–12F; [mobile runbook](../../mobile/README.md) ghi cấu hình/lệnh/artifacts/update/rollback. P12 chưa PASS: cloud rollout, GitHub native consent, full UI/native module parity và đo hiệu năng máy thật còn gate, không được suy ra từ build.
