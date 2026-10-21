import { AccessError } from './policy';
export async function readCredentials(request: Request, timeoutMs = 5000) {
  // Read a bounded stream, including requests without Content-Length.
  const reader = request.body?.getReader();
  if (!reader) throw new AccessError(400, 'invalid_body');
  let body = '';
  let bytes = 0;
  const decoder = new TextDecoder();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => { timer = setTimeout(() => { reject(new AccessError(400, 'body_timeout')); void reader.cancel(); }, timeoutMs); });
  try {
    while (true) {
      const { value, done } = await Promise.race([reader.read(), timeout]);
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 4096) { await reader.cancel(); throw new AccessError(413, 'invalid_body'); }
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
  } finally { clearTimeout(timer); reader.releaseLock(); }
  let input;
  try { input = JSON.parse(body); } catch { throw new AccessError(400, 'invalid_body'); }
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new AccessError(400, 'invalid_body');

  return input as Record<string, unknown>;
}
