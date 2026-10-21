import { bearerToken, mobileCors, mobilePreflight } from '@/lib/auth/mobile-policy';
import { accessFailure } from '@/lib/auth/api';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { readBackendEnvironment } from '@/lib/supabase/env';
import type { Database } from '@/types/database';

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === '/.well-known/assetlinks.json') return NextResponse.next();
  let response = NextResponse.next({ request });
  const finish = (result: NextResponse) => {
    response.cookies.getAll().forEach(cookie => result.cookies.set(cookie));
    result.headers.set('Cache-Control', 'private, no-store');
    mobileCors(request, result);
    return result;
  };
  try {
    if (request.nextUrl.pathname.startsWith('/api/')) {
      if (request.method === 'OPTIONS') return mobilePreflight(request);
      if (bearerToken(request) !== undefined || request.nextUrl.pathname.startsWith('/api/mobile/')) return finish(response);
    }
    const env = readBackendEnvironment({
      APP_ENV: process.env.APP_ENV, APP_ORIGIN: process.env.APP_ORIGIN,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      SUPABASE_PROJECT_REF: process.env.SUPABASE_PROJECT_REF, VERCEL_ENV: process.env.VERCEL_ENV,
    });
    const supabase = createServerClient<Database>(env.url, env.publishableKey, {
      cookieOptions: { sameSite: 'lax', secure: env.mode !== 'local', path: '/' },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(values) {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    const { data: { user } } = await supabase.auth.getUser();
    // Auth routes and API have their own authoritative checks. Proxy only redirects pages.
    if (!user && !request.nextUrl.pathname.startsWith('/auth/') && !request.nextUrl.pathname.startsWith('/api/')) {
      const login = new URL('/auth/auth2/login', env.origin);
      login.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search);
      return finish(NextResponse.redirect(login));
    }
    return finish(response);
  } catch (error) {
    if (request.nextUrl.pathname.startsWith('/api/')) return mobileCors(request, accessFailure(error));
    if (request.nextUrl.pathname.startsWith('/auth/')) return finish(response);
    return finish(NextResponse.json({ code: 'backend_not_configured' }, { status: 500 }));
  }
}
export const config = { matcher: ['/((?!_next/static|_next/image|images/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)'] };
