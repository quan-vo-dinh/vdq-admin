'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { browserSupabase } from '@/lib/supabase/browser';
import { safeNext } from '@/lib/auth/policy';

export function GithubLogin({ config, initialError }: {
  config: { url: string; publishableKey: string; origin: string } | null;
  initialError?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError ? 'Không thể đăng nhập. Kiểm tra quyền owner hoặc thử lại.' : '');
  async function signIn() {
    if (!config) return;
    setLoading(true); setError('');
    try {
      const client = browserSupabase(config);
      const callback = new URL('/auth/callback', config.origin);
      callback.searchParams.set('next', safeNext(new URLSearchParams(window.location.search).get('next')));
      const { data, error } = await client.auth.signInWithOAuth({
        provider: 'github', options: { redirectTo: callback.href, skipBrowserRedirect: true },
      });
      if (error || !data.url) throw new Error('oauth_failed');
      // Check provider availability before leaving the login page (SDK only constructs URL).
      const settings = await fetch(`${config.url}/auth/v1/settings`, { headers: { apikey: config.publishableKey } });
      if (!settings.ok || !(await settings.json()).external?.github) throw new Error('provider_disabled');
      window.location.assign(data.url);
    } catch {
      setError('GitHub chưa sẵn sàng hoặc kết nối thất bại. Kiểm tra cấu hình rồi thử lại.');
      setLoading(false);
    }
  }
  return <div className="space-y-4">
    <p className="text-sm text-muted-foreground text-center">Đăng nhập GitHub của chủ dashboard.</p>
    {(!config || error) && <p role="alert" className="text-sm text-destructive">{config ? error : 'Backend chưa được cấu hình. Hãy kiểm tra env local.'}</p>}
    <Button variant="outline" className="h-9 shadow-xs gap-2 px-5! py-2! rounded-lg text-sm font-medium dark:bg-background w-full" disabled={!config || loading} onClick={signIn}>
      <Image src="/images/svgs/github-icon.svg" alt="" width={16} height={16} className="dark:invert" />
      {loading ? 'Đang kết nối…' : 'Sign in with Github'}
    </Button>
  </div>;
}
