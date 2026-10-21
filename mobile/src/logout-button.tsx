import { useState } from 'react';
import { useSWRConfig } from 'swr';
import { Button } from '@/components/ui/button';
import { logoutSession } from './session';
export function LogoutButton() {
 const { cache, mutate } = useSWRConfig(); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
 return <div><Button disabled={busy} variant="outline" onClick={async () => { setBusy(true); try { await logoutSession(); await mutate(() => true, undefined, { revalidate: false }); for (const key of cache.keys()) cache.delete(key); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }}>Đăng xuất</Button>{error && <p role="alert">{error}</p>}</div>;
}
