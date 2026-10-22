import { announceMutation, isCrudRequest } from "./mutation-feedback";

type Transport = (path: string, init?: RequestInit) => Promise<Response>;
export type ApiRequestInit = RequestInit & { feedback?: boolean };
let transport: Transport | undefined;
export function configureApiTransport(value: Transport) { transport = value; }
/** No automatic mutation retries: callers retain drafts and handle 409 explicitly. */
export async function apiFetch(path: string, init?: ApiRequestInit) {
  if (!path.startsWith('/api/')) throw new Error('API path must be relative /api/');
  const { feedback = true, ...request } = init ?? {};
  const method = (request.method ?? 'GET').toUpperCase();
  const notify = feedback && isCrudRequest(path, method);
  let response: Response;
  try {
    response = await (transport ? transport(path, request) : fetch(path, request));
  } catch (error) {
    if (notify) announceMutation({ path, method, ok: false });
    throw error;
  }
  if (notify) {
    const body = response.ok ? null : await response.clone().json().catch(() => null);
    announceMutation({ path, method, ok: response.ok, status: response.status,
      code: typeof body?.code === 'string' ? body.code : undefined });
  }
  return response;
}
