type Transport = (path: string, init?: RequestInit) => Promise<Response>;
let transport: Transport | undefined;
export function configureApiTransport(value: Transport) { transport = value; }
/** No automatic mutation retries: callers retain drafts and handle 409 explicitly. */
export function apiFetch(path: string, init?: RequestInit) {
  if (!path.startsWith('/api/')) throw new Error('API path must be relative /api/');
  return transport ? transport(path, init) : fetch(path, init);
}
