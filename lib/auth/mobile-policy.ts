import { AccessError } from './policy';
export const MOBILE_ORIGIN = 'https://localhost';
export const CORS_METHODS = 'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS';
export const CORS_HEADERS = 'authorization, content-type, browserrefreshed';
export function bearerToken(request: Request) {
  const value = request.headers.get('authorization');
  if (value === null) return undefined;
  const match = /^Bearer ([A-Za-z0-9._~-]+)$/.exec(value);
  if (!match || match[1].length > 8192) throw new AccessError(401, 'invalid_bearer');
  return match[1];
}
function allowedOrigin(request: Request) {
  const origin = request.headers.get('origin');
  return origin === MOBILE_ORIGIN || (process.env.APP_ENV === 'local' && process.env.MOBILE_DEV_BROWSER === '1' && origin === 'http://localhost:5173');
}
export function checkMobileOrigin(request: Request) {
  if (!allowedOrigin(request)) throw new AccessError(403, 'invalid_origin');
}
export function mobileCors(request: Request, response: Response) {
  response.headers.set('Vary', 'Origin, Cookie, Authorization');
  response.headers.set('Cache-Control', 'private, no-store');
  if (allowedOrigin(request)) {
    response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin')!);
    response.headers.set('Access-Control-Allow-Methods', CORS_METHODS);
    response.headers.set('Access-Control-Allow-Headers', CORS_HEADERS);
    response.headers.set('Access-Control-Expose-Headers', 'Retry-After');
  }
  return response;
}
export function mobilePreflight(request: Request) {
  checkMobileOrigin(request);
  const method = request.headers.get('access-control-request-method');
  if (!method || !CORS_METHODS.split(', ').includes(method) || method === 'OPTIONS') throw new AccessError(403, 'invalid_method');
  const headers = request.headers.get('access-control-request-headers')?.toLowerCase().split(',').map(x => x.trim()) ?? [];
  if (headers.some(header => !CORS_HEADERS.split(', ').includes(header))) throw new AccessError(403, 'invalid_headers');
  return mobileCors(request, new Response(null, { status: 204 }));
}
