import { accessFailure, privateResponse } from '@/lib/auth/api';
import { backendEnvironment } from '@/lib/supabase/server';
import { AccessError, checkOrigin, safeNext } from '@/lib/auth/policy';
import { loginLimiter, verifyEnvCredentials } from '@/lib/auth/env-credentials';
import { issueOwnerSession } from '@/lib/auth/owner-session';

const limited = loginLimiter();
export async function POST(request: Request) {
  try {
    checkOrigin(request, backendEnvironment().origin);
    if (!request.headers.get('content-type')?.startsWith('application/json')) throw new AccessError(400, 'invalid_body');
    return await limited(async () => {
      // Read a bounded stream, including requests without Content-Length.
      const reader = request.body?.getReader();
      if (!reader) throw new AccessError(400, 'invalid_body');
      let body = '';
      let bytes = 0;
      const decoder = new TextDecoder();
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          bytes += value.byteLength;
          if (bytes > 4096) { await reader.cancel(); throw new AccessError(413, 'invalid_body'); }
          body += decoder.decode(value, { stream: true });
        }
        body += decoder.decode();
      } finally { reader.releaseLock(); }
      let input;
      try { input = JSON.parse(body); } catch { throw new AccessError(400, 'invalid_body'); }
      if (!input || typeof input !== 'object' || Array.isArray(input)) throw new AccessError(400, 'invalid_body');
      await verifyEnvCredentials(input.username, input.password, process.env);
      await issueOwnerSession();
      return privateResponse(Response.json({ next: safeNext(typeof input.next === 'string' ? input.next : undefined) }));
    });
  } catch (error) {
    const response = accessFailure(error);
    if (error instanceof AccessError && error.status === 429) response.headers.set('Retry-After', '60');
    return response;
  }
}
