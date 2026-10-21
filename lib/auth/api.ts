import 'server-only';
import { backendEnvironment } from '@/lib/supabase/server';
import { requireOwner } from './owner';
import { AccessError, checkOrigin, checkHostedFeature } from './policy';

export function privateResponse(response: Response) {
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('Vary', 'Cookie');
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
      checkOrigin(request, env.origin);
      await requireOwner();
      if (env.mode !== 'local') checkHostedFeature(new URL(request.url).pathname, request.method);
      return privateResponse(await handler(request));
    } catch (error) { return accessFailure(error); }
  };
}
