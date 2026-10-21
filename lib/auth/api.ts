import 'server-only';
import { requestAuth } from './request-context';
import { bearerClient } from './bearer';
import { bearerToken, checkMobileOrigin, mobileCors } from './mobile-policy';
import { backendEnvironment } from '@/lib/supabase/server';
import { requireOwner } from './owner';
import { AccessError, checkOrigin, checkHostedFeature } from './policy';

export function privateResponse(response: Response) {
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('Vary', 'Origin, Cookie, Authorization');
  return response;
}
export function accessFailure(error: unknown) {
  const known = error instanceof AccessError;
  return privateResponse(Response.json({ code: known ? error.code : 'unavailable' }, { status: known ? error.status : 500 }));
}
export function withOwner<T extends Request>(handler: (request: T) => Response | Promise<Response>) {
  return async (request: T) => {
    try {
      const env = backendEnvironment();
      const token = bearerToken(request);
      const execute = async () => {
        await requireOwner();
        if (env.mode !== 'local') checkHostedFeature(new URL(request.url).pathname, request.method);
        return mobileCors(request, privateResponse(await handler(request)));
      };
      if (token !== undefined) {
        checkMobileOrigin(request);
        return await requestAuth.run({ client: bearerClient(token), token }, execute);
      }
      checkOrigin(request, env.origin);
      return await execute();
    } catch (error) { return mobileCors(request, accessFailure(error)); }
  };
}
