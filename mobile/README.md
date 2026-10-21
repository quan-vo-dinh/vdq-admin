# Personal Dashboard Android (P12 in progress)

Android packages a local React/Vite bundle. Next.js continues serving web and API;
root Next config is not static export. The APK never uses `server.url`.

## Requirements and identity

- Node 22.23.2, pnpm 11.22.0; root lockfile and `.pnpmfile.cjs` remain authoritative.
- Capacitor core/android/CLI 8.5.3; App 8.1.2, Browser 8.0.5,
  Filesystem 8.1.5, Keyboard 8.0.6, Network 8.0.1, Share 8.0.3.
- Vite 8.3.5, React plugin 6.1.2, React Router 7.18.4.
- JDK 21; generated Gradle wrapper 8.14.3, AGP 8.13.0, minSdk24,
  compile/target SDK36. macOS CLI defaults installed in `/opt/homebrew`;
  override JAVA_HOME/ANDROID_HOME elsewhere. Android Studio is optional for CLI builds.
- Development identity: `dev.vodinhquan.dashboard`, name `bin Dashboard`;
  icon reuses the repository logo. Confirm before the first signed distribution.
- versionName `0.1.0-p12`, versionCode `1`. Increment versionCode for updates.

## Configuration and commands

Create `mobile/.env.local` from `.env.example`. Only public config goes here:

```dotenv
VITE_API_BASE_URL=https://your-explicit-backend.example
VITE_OAUTH_REDIRECT=https://your-explicit-backend.example/auth/mobile/callback
```

The local ignored file currently explicitly selects https://vdq-admin.vercel.app
and the development custom callback scheme. Production **has not** received P12
backend changes. An APK using that origin cannot authenticate until the additive
backend rollout is explicitly authorized and performed. Never copy root private env
into mobile. No automatic production fallback exists.

```sh
pnpm dev                    # existing web :3000
pnpm build                  # web + typecheck
pnpm mobile:dev             # Vite development (HMR; not stable user QA)
pnpm mobile:typecheck
pnpm mobile:build           # production static bundle, rejects HTTP base
pnpm mobile:sync            # always rebuild then Capacitor sync
pnpm android:debug          # build + sync + assembleDebug
pnpm android:unsigned       # build + sync + unsigned release; not installable
pnpm test:mobile-contracts
pnpm mobile:scan            # static + existing APK secret scan/checksums
pnpm test:mobile-api        # existing LOCAL owner credentials; localhost:3212
```

Stable browser QA uses a separate output directory, so APK builds do not reload it:

```sh
# Keep the backend's validated APP_ORIGIN=http://localhost:3000.
MOBILE_DEV_BROWSER=1 pnpm start --port 3212
VITE_API_BASE_URL=http://localhost:3212 pnpm mobile:preview:build
VITE_API_BASE_URL=http://localhost:3212 pnpm mobile:preview
```

`MOBILE_DEV_BROWSER=1` permits exactly http://localhost:5173 only when APP_ENV=local.
It does not open production CORS. Preview refresh/session data stays in memory;
a browser refresh needs login again. Android refresh/PKCE uses the native vault.
Use `mobile:dev` for HMR only. Watchers and Tailwind exclude native/generated files.

For a connected Android device using local backend, use an explicit HTTPS endpoint
trusted by the device. Alternatively **debug only**, set VITE_API_BASE_URL to a
loopback host forwarded with adb (and VITE_LOCAL_AUTH_URL for Supabase :54321),
run `mobile:build:local`, then `CAPACITOR_DEV_HTTP=1 pnpm exec cap sync android`
and `node scripts/mobile/android-build.mjs debug`. This is opt-in cleartext debug;
release rejects the resulting native cleartext config. No certificate bypass,
public tunnel, or automatic LAN exposure is configured. Rebuild/sync production
before releasing. Set VITE_LOCAL_AUTH_URL only for development builds.

## Auth and backend rollout gates

1. Review/test `20261021000200_mobile_login_limiter.sql`. Applied to local only;
   cloud execution requires separate authorization. Grants are service_role only.
   The global owner grant allows 10 attempts/minute across instances, fails closed
   without the migration, plus existing in-process concurrency/attempt limits.
2. Additive Next API update supports cookie and bearer through the same requireOwner
   and RLS repositories. No new owner, signup or privileged CRUD. Browser cookie
   mutation Origin validation remains. Invalid Authorization never falls back cookie.
3. Config and credentials endpoints live at `/api/mobile/v1/auth/*`. Tokens come
   from Supabase Auth for the existing verified GitHub owner after env password check.
4. Android keeps access tokens only in JS memory and encrypted refresh/PKCE in a
   small app-owned AES-GCM/Android Keystore plugin. Keys are bound to the API origin.
   Android backup is disabled. The WebView private cache and export cache clear on logout.
5. GitHub uses system Browser, SDK PKCE, one-time code, separate nonce, exact callback
   host/path, five-minute pending lifetime and replay rejection. Tokens never go in URLs.
6. Development scheme `dev.vodinhquan.dashboard://auth/callback` is declared in the
   manifest. Verified production App Link is https://vdq-admin.vercel.app/auth/mobile/callback.
   Final `ANDROID_SIGNING_SHA256` must be supplied server-side by the user; the public
   `/.well-known/assetlinks.json` returns 404 until configured. Register the exact
   callback with Supabase; preserve web callback/provider settings. These external
   configuration changes and real GitHub consent have not been performed in P12.
7. Refresh is single-flight, stored rotation commits before access is returned;
   logout waits for refresh, revokes that session then clears private state/cache.
   Logout requires network for verified revocation. Access JWT may remain valid until expiry.
   No CRUD retries or offline mutation queue. Network timeouts never replay writes.

## APK installation, update, signing and rollback

Debug artifact: `mobile/android/app/build/outputs/apk/debug/app-debug.apk`.
Unsigned release: `mobile/android/app/build/outputs/apk/release/app-release-unsigned.apk`.
Use `pnpm mobile:scan` for current bytes and SHA256; changing source requires rebuild.
Debug uses the standard local Android debug certificate, not the release certificate.

After device-specific consent/USB authorization, install debug with:

```sh
adb -s DEVICE_SERIAL install -r mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

Do not uninstall to update: that destroys device-local session/drafts. Debug and
release certificates differ; test release update with the same user-owned release key.
For a signed release, the user supplies an existing keystore outside Git and sets
DASHBOARD_KEYSTORE (absolute), DASHBOARD_KEY_ALIAS, DASHBOARD_STORE_PASSWORD,
DASHBOARD_KEY_PASSWORD privately in their terminal, then `pnpm android:release`.
No release key is generated or selected by the agent. Do not put passwords in scripts,
CLI arguments, chat, screenshots or checked-in files. Save key backup under user control.

Rollback frontend by publishing a fixed APK with a **higher** versionCode and the
same key/appId. Android normally rejects downgrades. Retain compatible backend;
rollback web deployment only through an authorized rollout, no database reset or
owner change. The additive limiter may remain during rollback. Old production web
cookies continue working; web deploy does not update bundled APK JavaScript.

## Acceptance still required

Build/test passes are not physical acceptance. See `docs/backend-rollout/evidence/P12.md`.
Required: all module flows, native picker/share, CSV, Notes Vietnamese IME,
Calendar scrolling, dark/font scale/keyboard/Back/overlays, login both methods,
refresh/process kill/resume/offline, web↔Android same-revision conflict, install/update,
private cache clearance, release performance on a real medium/low specification phone.
Measure ≥20 cold/warm/interaction samples, p95 shell≤3s/resume≤1s/local UI≤100ms,
and memory/jank over 30 route/dialog cycles. These are targets, not measured results.
