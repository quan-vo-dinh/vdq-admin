'use client';
import { useState } from 'react';
import { useSWRConfig } from 'swr';
import { Button } from '@/components/ui/button';
export function LogoutButton() {
  const { cache, mutate } = useSWRConfig();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function logout() {
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) throw new Error('logout_failed');
      await mutate(() => true, undefined, { revalidate: false });
      for (const key of cache.keys()) cache.delete(key);
      // Full navigation also discards React state and the client router cache.
      window.location.replace('/auth/auth2/login');
    } catch { setError('Đăng xuất thất bại. Vui lòng thử lại.'); setBusy(false); }
  }
  return <div className="space-y-2">
    <Button variant="outline" onClick={logout} disabled={busy}>{busy ? 'Đang đăng xuất…' : 'Đăng xuất'}</Button>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </div>;
}
