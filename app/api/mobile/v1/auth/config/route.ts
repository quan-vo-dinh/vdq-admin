import { credentialsConfigured } from '@/lib/auth/env-credentials';
import { backendEnvironment } from '@/lib/supabase/server';
import { privateResponse, accessFailure } from '@/lib/auth/api';
import { checkMobileOrigin, mobileCors } from '@/lib/auth/mobile-policy';
export async function GET(request: Request) {
 try {
  checkMobileOrigin(request);
  const env = backendEnvironment();
  return mobileCors(request, privateResponse(Response.json({ url: env.url, publishableKey: env.publishableKey, credentialsEnabled: credentialsConfigured(process.env) })));
 } catch (error) { return mobileCors(request, accessFailure(error)); }
}
