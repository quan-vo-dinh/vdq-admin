import { apiFetch } from "@/lib/api/transport";
export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
async function readResponse(res: Response) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, typeof body.code === 'string' ? body.code : 'request_failed', 'Request failed');
  }
  return res.json();
}

// SWR fetcher function

const getFetcher = (url: string) =>
  apiFetch(url, {
    method: 'GET',
    headers: { browserrefreshed: 'false' },
  }).then(readResponse)

const postFetcher = (url: string, arg: unknown) =>
  apiFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arg),
  }).then(readResponse)

const putFetcher = (url: string, arg: unknown) =>
  apiFetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arg),
  }).then(readResponse)

const patchFetcher = (url: string, arg: unknown) =>
  apiFetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arg),
  }).then(readResponse)

const deleteFetcher = (url: string, arg: unknown) =>
  apiFetch(url, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arg),
  }).then(readResponse)

export { getFetcher, postFetcher, putFetcher, deleteFetcher, patchFetcher }
