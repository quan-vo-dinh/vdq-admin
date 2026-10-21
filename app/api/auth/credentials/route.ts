import { readCredentials } from '@/lib/auth/read-credentials';
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
      const input = await readCredentials(request);
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
