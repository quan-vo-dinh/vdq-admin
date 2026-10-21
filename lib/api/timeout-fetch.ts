/** Bound network waits without replaying a request that may have reached the server. */
export async function timeoutFetch(input: RequestInfo | URL, init?: RequestInit, timeoutMs = 15000) {
 const controller = new AbortController();
 const upstream = init?.signal;
 const abort = () => controller.abort();
 if (upstream?.aborted) abort();
 upstream?.addEventListener('abort', abort, { once: true });
 const timer = setTimeout(abort, timeoutMs);
 try { return await fetch(input, { ...init, signal: controller.signal }); }
 catch (error) {
  if (controller.signal.aborted && !upstream?.aborted) throw new Error('Kết nối quá chậm. Vui lòng thử lại; yêu cầu chưa được tự gửi lại.');
  throw error;
 } finally { clearTimeout(timer); upstream?.removeEventListener('abort', abort); }
}
