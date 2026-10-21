import { timeoutFetch } from '@/lib/api/timeout-fetch';
import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';
import { Browser } from '@capacitor/browser';
import { secureStorage } from './secure-storage';
import { apiBase, oauthRedirect } from './config';
import { configureApiTransport } from '@/lib/api/transport';
let client: SupabaseClient;
let session: Session | null = null;
let refreshing: Promise<string> | undefined;
let epoch = 0;
let sdkMemory: string | null = null;
let ready: Promise<void> | undefined;
export type AuthConfig = { url: string; publishableKey: string; credentialsEnabled: boolean };
export let authConfig: AuthConfig;
async function initialize() {
 const r = await timeoutFetch(apiBase + '/api/mobile/v1/auth/config', { credentials: 'omit' });
 if (!r.ok) throw new Error('Backend mobile chưa sẵn sàng.');
 authConfig = await r.json();
 client = createClient(import.meta.env.DEV && import.meta.env.VITE_LOCAL_AUTH_URL ? import.meta.env.VITE_LOCAL_AUTH_URL : authConfig.url, authConfig.publishableKey, {
  global: { fetch: timeoutFetch },
  auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: false, detectSessionInUrl: false,
   storageKey: 'dashboard-mobile',
   storage: {
    getItem: async key => key.endsWith('-code-verifier') ? secureStorage.get(key) : sdkMemory,
    setItem: async (key, value) => {
     if (key.endsWith('-code-verifier')) { await secureStorage.set(key, value); return; }
     const next = JSON.parse(value) as Session;
     // Commit rotated refresh token before exposing the new access token.
     if (next.refresh_token) await secureStorage.set('refresh', next.refresh_token);
     sdkMemory = value;
    },
    removeItem: async key => { if (key.endsWith('-code-verifier')) await secureStorage.remove(key); else sdkMemory = null; },
   },
  },
 });
 configureApiTransport(async (path, init) => {
  const token = await accessToken();
  const headers = new Headers(init?.headers); headers.set('Authorization', `Bearer ${token}`);
  // A sent mutation is never replayed on 401/network failure.
  const response = await timeoutFetch(apiBase + path, { ...init, headers, credentials: 'omit', cache: 'no-store' });
  if (response.status === 401) window.dispatchEvent(new Event('session-expired'));
  return response;
 });
}
export function initSession() { return ready ??= initialize().catch(error => { ready = undefined; throw error; }); }
export async function accessToken() {
 if (session && (session.expires_at ?? 0) * 1000 > Date.now() + 60000) return session.access_token;
 if (refreshing) return refreshing;
 const generation = epoch;
 refreshing = (async () => {
  const token = await secureStorage.get('refresh');
  if (!token) throw new Error('Vui lòng đăng nhập.');
  const { data, error } = await client.auth.refreshSession({ refresh_token: token });
  if (error || !data.session) {
   if (error && [400, 401, 403].includes(error.status ?? 0)) { await secureStorage.clear(); session = null; window.dispatchEvent(new Event('session-expired')); }
   throw new Error('Không làm mới được phiên. Kiểm tra mạng hoặc đăng nhập lại.');
  }
  if (generation !== epoch) throw new Error('Phiên đã đóng.');
  session = data.session;
  return session.access_token;
 })().finally(() => { refreshing = undefined; });
 return refreshing;
}
export async function verifySession() {
 await accessToken();
 const response = await timeoutFetch(apiBase + '/api/auth/session', { headers: { Authorization: `Bearer ${session!.access_token}` }, credentials: 'omit' });
 if (!response.ok) { if ([401,403].includes(response.status)) { await client.auth.signOut({ scope: 'local' }); await secureStorage.clear(); session = null; } throw new Error('Không xác minh được owner session.'); }
}
export async function loginCredentials(username: string, password: string) {
 const r = await timeoutFetch(apiBase + '/api/mobile/v1/auth/credentials', { method: 'POST', credentials: 'omit', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
 if (!r.ok) throw new Error(r.status === 429 ? 'Thử quá nhiều lần. Đợi một phút.' : 'Không đăng nhập được. Kiểm tra tài khoản, mạng và cấu hình server.');
 const tokens = await r.json();
 const { data, error } = await client.auth.setSession(tokens);
 if (error || !data.session) throw new Error('Session không hợp lệ.');
 session = data.session;
 await verifySession();
}
export async function loginGithub() {
 const nonce = crypto.randomUUID();
 const redirect = new URL(oauthRedirect); redirect.searchParams.set('state', nonce);
 await secureStorage.set('oauth', JSON.stringify({ nonce, at: Date.now() }));
 const { data, error } = await client.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: redirect.href, skipBrowserRedirect: true } });
 if (error || !data.url) throw new Error('GitHub chưa sẵn sàng.');
 await Browser.open({ url: data.url });
}
let exchanging = false;
export async function handleCallback(value: string) {
 const url = new URL(value), expected = new URL(oauthRedirect);
 if (url.protocol !== expected.protocol || url.host !== expected.host || url.pathname !== expected.pathname || url.hash || exchanging) throw new Error('Callback không hợp lệ.');
 const pending = JSON.parse(await secureStorage.get('oauth') ?? 'null');
 if (!pending || Date.now() - pending.at > 300000 || url.searchParams.get('state') !== pending.nonce || url.searchParams.getAll('code').length !== 1) throw new Error('OAuth đã hết hạn hoặc callback không hợp lệ.');
 exchanging = true;
 try {
  await secureStorage.remove('oauth');
  const { data, error } = await client.auth.exchangeCodeForSession(url.searchParams.get('code')!);
  if (error || !data.session) throw new Error('Không hoàn tất được GitHub.');
  session = data.session;
  await verifySession();
  await Browser.close().catch(() => {});
 } finally { exchanging = false; }
}
export async function logoutSession() {
 // Finish an in-flight refresh before revoking its newly rotated session.
 if (refreshing) await refreshing.catch(() => {});
 const { error } = await client.auth.signOut({ scope: 'local' });
 if (error) throw new Error('Cần kết nối để thu hồi phiên. Vui lòng thử lại.');
 epoch++; session = null; sdkMemory = null;
 await secureStorage.clear();
 window.dispatchEvent(new Event('session-expired'));
}
export function pauseSession() { client?.auth.stopAutoRefresh(); }
