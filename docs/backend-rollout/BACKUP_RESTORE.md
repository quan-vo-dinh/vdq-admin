# Backup / restore — P09 local baseline

User chọn `~/Documents/dashboard-backups`, **manual hằng ngày** (2026-10-20). Máy ngủ/tắt không chạy backup.
Recovery point là bundle thành công gần nhất; không có scheduler, không cam kết RPO 24h/RTO 4h.
Tool `backup.mjs` vẫn cố định stack local. **Hosted dùng `backup-hosted.mjs` riêng** (xem mục cuối). P11 phải nối/test nguồn hosted bằng connection
explicit trước khi nhập dữ liệu production; không đổi mặc định sang linked project.

## Chạy thường xuyên

Từ repo, khi Docker/Supabase local đang chạy:

```bash
pnpm backend:backup --directory "$HOME/Documents/dashboard-backups" \
  --key "$HOME/.config/dashboard-backup-recovery/private.pem.pub"
```

Chỉ cần public key để backup. Private recovery key đã được tạo 3072-bit RSA tại
`~/.config/dashboard-backup-recovery/private.pem` (0600, thư mục 0700), **user cần nhập vào password manager
và giữ bản phục hồi riêng**. Không gửi chat/Git. Không tạo lại/overwrite key hiện có.
Một máy mới chưa có key mới dùng `node scripts/backend/backup.mjs --mode keygen --key /outside/repo/private.pem`.

Lệnh in thời điểm UTC, source/app/schema version, counts, số ảnh và file `.enc.json`; không in dữ liệu.
Bundle dùng RSA-OAEP-SHA256 + AES-256-GCM, chứa 16 bảng đúng scope, exact numeric text,
owner numeric GitHub ID/UUID, migration SQL/version và **bytes của mọi ảnh goal được tham chiếu**.
Không export Auth sessions/tokens/secrets; không export data Today/Blog/Developer/ticket template.
SQL migration local lịch sử vẫn có Today để dựng đúng schema local; P11 cần tách nó theo README.

Script khóa SHARE trên các bảng scope + storage.objects khi chụp, chặn writes trong khoảng ngắn;
lock timeout 5s, safety window 60s, idle timeout 90s. Download thiếu ảnh/lỗi → fail, không xuất bundle thiếu.
Quy trình app dùng object immutable nên ảnh đang đọc không bị ghi đè. Không upload/xóa trực tiếp Storage
bằng công cụ ngoài trong lúc backup. Dữ liệu/schema chỉ đọc. Plaintext chỉ ở memory, output atomic 0600 ngoài repo.
Chỉ sau khi publish bundle mới thành công mới giữ 3 tên backup mới nhất trong thư mục dành riêng này.
Lỗi key/export không xóa các bundle trước. Giữ thêm bản tốt riêng nếu cần recovery point lâu hơn.

Kiểm tra giải mã, thay INPUT bằng file thật từ summary (không dùng glob nhiều file):

```bash
pnpm backend:backup:verify --input /absolute/path/to/backup.enc.json \
  --key "$HOME/.config/dashboard-backup-recovery/private.pem"
```

## Restore vào đích riêng

Tool restore **chỉ chấp nhận `/tmp/dashboard-p09-drill`**, project `dashboard-p09-drill`, API :55321,
DB container riêng; không nhận cloud URL hoặc ghi vào stack app :54321. Target phải có đúng migrations,
owner đã bootstrap cùng numeric GitHub ID, business tables rỗng. Không overwrite dữ liệu đích.

1. Dựng schema riêng, giữ source đang hoạt động:

   ```bash
   node scripts/backend/prepare-restore-drill.mjs
   pnpm exec supabase start --workdir /tmp/dashboard-p09-drill \
     -x studio,postgres-meta,mailpit,realtime,edge-runtime,logflare,vector,supavisor
   ```

   Không đưa output status credentials vào Git/chat. Dùng đúng code/migrations được ghi trong bundle;
   restore kiểm tra version và nội dung migration trùng đích. Mismatch → dừng, không repair schema source.
2. Recovery thật: đăng nhập **đúng GitHub numeric ID trong bundle** ở Auth đích, đối chiếu
   `auth.identities.provider='github'`, `provider_id` và `identity_data.sub`, đúng một user; dùng logic
   `scripts/backend/bootstrap-owner.mjs` với **container đích explicit**, không chạy nguyên wrapper source.
   Bind private.app_owner vào UUID đích sau kiểm chứng, đóng signup. Không dùng email làm quyền.
   Cấu hình OAuth cho Auth target là bước operator riêng; không tái bootstrap owner source.
3. Khi owner đích đã xác minh và business tables rỗng:

   ```bash
   pnpm backend:restore:drill --input /absolute/path/to/backup.enc.json \
     --key "$HOME/.config/dashboard-backup-recovery/private.pem"
   ```

   Tool xác minh GitHub ID, remap owner_id, singleton IDs và prefix ảnh sang UUID đích;
   upload bytes vào bucket private trước, import data trong một transaction theo FK, rồi kiểm counts/checksum.
   Upload/import fail sẽ cố xóa những object vừa tạo. Không nhập sessions/Auth schema cũ.
4. Mở app dành riêng cho target, kiểm Notes/Calendar/Finance/Learning/Profile và ảnh;
   kiểm owner access + non-owner deny. **Không trỏ app đang dùng sang target drill.**
   Drill phiên này dùng source copy ngoài repo tại `/tmp/dashboard-p09-app`, sửa duy nhất ports/origin
   validator trong bản copy (:55321/:3102), local test session trong scratch route; runtime source không nới guard.
   Phiên đã kiểm UI Notes/goal + private signed image của target. Test identity là synthetic;
   không coi là OAuth recovery consent thật thứ hai. P03 vẫn là evidence OAuth thật.
5. Stop riêng target khi xong:

   ```bash
   pnpm exec supabase stop --workdir /tmp/dashboard-p09-drill
   ```

   Không stop/reset stack source hoặc Docker khác. Lệnh này giữ volumes; lần drill sau cần **đích disposable
   rỗng mới**. Chỉ nếu đã xác nhận dữ liệu target disposable: stop riêng `--workdir /tmp/dashboard-p09-drill
   --no-backup` để bỏ target cũ trước khi dựng lại. Không dùng `--all` hoặc reset linked/cloud.

## Drill fixture đã kiểm

Sau khi dựng **target rỗng**, `node scripts/backend/drill-backup-local.mjs` tạo synthetic Auth owner đích
(cùng numeric GitHub ID, UUID khác), fixture Notes rich text/event/expense/check-in/goal ảnh tại source,
backup encrypted → decrypt → restore → money/date/counts/media SHA256/RLS assertions.
`finally` chỉ dọn các UUID/ảnh fixture source của script, giữ tất cả dữ liệu khác.
Script từ chối target đã có owner/business data trước khi mutate. Không dùng trên hosted.

Xem [P09 evidence](evidence/P09.md). Browser fixtures riêng P08 đã được dọn bằng UUID/CAS;
backup cuối phiên là source sau cleanup. Bundle drill có fixture được giữ làm bằng chứng encrypted ngoài Git.

## Hosted production — P11

Chạy từ repo, Supabase CLI đã đăng nhập đúng project. Lệnh cố định target `wcgdvsiiemurehkprvqw`, không dùng runtime env/admin key hoặc DB URL truyền qua command:

```bash
node scripts/backend/backup-hosted.mjs \
  --directory "$HOME/Documents/dashboard-backups/hosted" \
  --key "$HOME/.config/dashboard-backup-recovery/private.pem.pub"
```

Manual hằng ngày theo lựa chọn user. Chỉ public key cần khi backup; giữ3 bundle hosted thành công mới nhất trong thư mục hosted riêng, không prune local bundles. Không có scheduler/RPO24h cam kết. Tool dùng CLI Management API snapshot SQL và backup-only Storage credential trong memory. Numeric giữ text; source data/owner/schema thay đổi trong lúc tải ảnh thì abort, chạy lại khi không ghi. Không log key/data; output chỉ metadata/counts. P11 first cloud bundle đã decrypt verify với private key gốc ngoài Git. User yêu cầu bỏ qua import iCloud Keychain, không đánh dấu đã có recovery copy ở đó.

Verify bằng workflow P09 `backup.mjs --mode verify` với private key. Bundle có `source=hosted:wcgdvsiiemurehkprvqw` và SQL production variant không Today.

Hosted recovery vẫn chỉ restore vào target drill local đã chỉ định, không có remote reset/restore tự động. Khi cần dựng target rỗng để drill hosted bundle, dùng `node scripts/backend/prepare-restore-drill.mjs --production` để nguồn migrations đúng variant; default không flag vẫn dành bundle local lịch sử. Lệnh này chỉ chuẩn bị config/files, **không reset database đang có**, và không chứng minh schema của một volume drill cũ đã đổi. Dựng/verify target disposable rỗng từ variant trước restore; không đổi source local hoặc cloud. Restore kiểm tra versions/SQL bytes/owner verified/money/date/media như P09. P09 business tables/path mapping còn áp dụng vì Today không trong bundle scope; P11 đã test variant schema trên DB rỗng tách biệt.
