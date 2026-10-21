export class AccessError extends Error {
  constructor(public status: 400 | 401 | 403 | 404 | 409 | 413 | 429 | 500 | 503, public code: string) {
    super(code);
  }
}

// Only explicitly retained demo reads and the real daily.dev feed are hosted.
export function checkHostedFeature(pathname: string, method: string) {
  const path = pathname.replace(/\/$/, '');
  if (!/^\/api\/(?:blog|developer|ticket|userprofile|today)(?:\/|$)/.test(path)) return;
  if (['GET', 'HEAD'].includes(method) &&
      ['/api/blog', '/api/developer', '/api/developer/feed'].includes(path)) return;
  throw new AccessError(403, 'feature_not_enabled');
}

export function safeNext(value: string | null | undefined) {
  // Reject encoded path separators/control chars too; no second decode downstream.
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\x00-\x20\x7f]|%/i.test(value)) return '/';
  const parsed = new URL(value, 'https://internal.invalid');
  if (parsed.origin !== 'https://internal.invalid' || parsed.pathname.startsWith('/auth') || parsed.pathname.startsWith('/api')) return '/';
  return parsed.pathname + parsed.search + parsed.hash;
}

export function checkOrigin(request: Request, origin: string) {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method) &&
      (request.headers.get('origin') !== origin || request.headers.get('sec-fetch-site') === 'cross-site')) {
    throw new AccessError(403, 'invalid_origin');
  }
}

export function checkOwnerConfiguration(userId: string, githubId: string, env: { APP_OWNER_USER_ID?: string; GITHUB_OWNER_ID?: string }) {
  if (!env.APP_OWNER_USER_ID || !env.GITHUB_OWNER_ID) throw new AccessError(500, 'owner_not_configured');
  if (env.APP_OWNER_USER_ID !== userId || env.GITHUB_OWNER_ID !== githubId) throw new AccessError(403, 'owner_mismatch');
}
