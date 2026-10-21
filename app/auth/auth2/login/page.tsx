import { Suspense } from 'react';
import { connection } from 'next/server';
import type { Metadata } from 'next';
import { Card } from '@/components/ui/card';
import FullLogo from '@/app/(dashboard-layout)/layout/shared/logo/full-logo';
import { GithubLogin } from '@/app/components/auth/github-login';
import { credentialsConfigured } from '@/lib/auth/env-credentials';
import { backendEnvironment } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Đăng nhập', description: 'Log in to your personal dashboard.' };
async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await connection();
  let config = null;
  try {
    const env = backendEnvironment();
    config = { url: env.url, publishableKey: env.publishableKey, origin: env.origin };
  } catch { /* Render a useful configuration error; never fall back to a public dashboard. */ }
  const params = await searchParams;
  return <GithubLogin credentialsEnabled={credentialsConfigured(process.env)} config={config} initialError={params.error} />;
}
export default function BoxedLogin(props: { searchParams: Promise<{ error?: string }> }) {
  return <div className="min-h-screen flex items-center justify-center bg-accent px-4">
    <Card className="w-full max-w-md border-none shadow-lg p-6">
      <div className="mx-auto w-fit"><FullLogo /></div>
      <Suspense fallback={<p role="status">Loading sign in…</p>}><Login {...props} /></Suspense>
    </Card>
  </div>;
}
