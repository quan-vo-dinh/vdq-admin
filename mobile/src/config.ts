export const apiBase = new URL(import.meta.env.VITE_API_BASE_URL).origin;
export const oauthRedirect = import.meta.env.VITE_OAUTH_REDIRECT || 'dev.vodinhquan.dashboard://auth/callback';
