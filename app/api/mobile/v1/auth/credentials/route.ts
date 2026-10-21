import { checkMobileOrigin, mobileCors } from '@/lib/auth/mobile-policy';
import { privateResponse, accessFailure } from '@/lib/auth/api';
import { AccessError } from '@/lib/auth/policy';
import { readCredentials } from '@/lib/auth/read-credentials';
import { loginLimiter, verifyEnvCredentials } from '@/lib/auth/env-credentials';
import { issueOwnerSession } from '@/lib/auth/owner-session';
import { bearerClient } from '@/lib/auth/bearer';
import { consumeMobileLoginAttempt } from '@/lib/auth/mobile-rate-limit';
const limit = loginLimiter();
export async function POST(request: Request) {
 try {
  checkMobileOrigin(request);
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new AccessError(400, 'invalid_body');
  return await limit(async () => {
   await consumeMobileLoginAttempt();
   const input = await readCredentials(request);
   await verifyEnvCredentials(input.username, input.password, process.env);
   const session = await issueOwnerSession(bearerClient(''));
   if (!session) throw new AccessError(401, 'unauthenticated');
   return mobileCors(request, privateResponse(Response.json({ access_token: session.access_token, refresh_token: session.refresh_token, expires_at: session.expires_at })));
  });
 } catch (error) {
  const response = mobileCors(request, accessFailure(error));
  if (error instanceof AccessError && error.status === 429) response.headers.set('Retry-After', '60');
  return response;
 }
}
