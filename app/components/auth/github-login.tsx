'use client';
import { useState, type FormEvent } from 'react';
import Image from '@/lib/platform/image';
import { Input } from '@/components/ui/input';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { browserSupabase } from '@/lib/supabase/browser';
import { safeNext } from '@/lib/auth/policy';

export function GithubLogin({ config, initialError, credentialsEnabled }: {
  config: { url: string; publishableKey: string; origin: string } | null;
  initialError?: string;
  credentialsEnabled: boolean;
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError ? 'Không thể đăng nhập. Kiểm tra quyền owner hoặc thử lại.' : '');
  async function signInCredentials(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || !credentialsEnabled) return;
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/auth/credentials', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, next: new URLSearchParams(window.location.search).get('next') }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(response.status === 401 ? 'Tài khoản hoặc mật khẩu không đúng.' : response.status === 429
          ? 'Bạn đã thử quá nhiều lần. Vui lòng đợi một phút.' : 'Đăng nhập cá nhân chưa sẵn sàng. Kiểm tra cấu hình server.');
        return;
      }
      setPassword('');
      window.location.assign(safeNext(result.next));
    } catch { setError('Không thể kết nối. Vui lòng thử lại.'); }
    finally { setLoading(false); }
  }
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
    <div className="space-y-1 text-center">
      <h1 className="text-2xl font-semibold">Đăng nhập</h1>
      <p className="text-sm text-muted-foreground">Tài khoản cá nhân của chủ dashboard.</p>
    </div>
    <form onSubmit={signInCredentials} className="space-y-4">
      <FieldGroup>
        <Field><FieldLabel htmlFor="owner-username">Tài khoản</FieldLabel>
          <Input id="owner-username" name="username" autoComplete="username" required maxLength={128}
            value={username} onChange={event => setUsername(event.target.value)} disabled={loading || !credentialsEnabled} />
        </Field>
        <Field><FieldLabel htmlFor="owner-password">Mật khẩu</FieldLabel>
          <Input id="owner-password" name="password" type="password" autoComplete="current-password" required maxLength={1024}
            value={password} onChange={event => setPassword(event.target.value)} disabled={loading || !credentialsEnabled} />
        </Field>
      </FieldGroup>
      {!credentialsEnabled && <p className="text-sm text-muted-foreground">Chưa cấu hình đăng nhập cá nhân trên server.</p>}
      <Button type="submit" className="w-full" disabled={!config || !credentialsEnabled || loading}>{loading ? 'Đang đăng nhập…' : 'Đăng nhập'}</Button>
    </form>
    <div className="text-center text-sm text-muted-foreground">Hoặc tiếp tục với GitHub</div>
    {(!config || error) && <p role="alert" className="text-sm text-destructive">{config ? error : 'Backend chưa được cấu hình. Hãy kiểm tra env local.'}</p>}
    <Button variant="outline" className="h-9 shadow-xs gap-2 px-5! py-2! rounded-lg text-sm font-medium dark:bg-background w-full" disabled={!config || loading} onClick={signIn}>
      <Image src="/images/svgs/github-icon.svg" alt="" width={16} height={16} className="dark:invert" />
      {loading ? 'Đang kết nối…' : 'Sign in with Github'}
    </Button>
  </div>;
}
