import { useLocation, useNavigate, useSearchParams as search } from 'react-router-dom';
import { useMemo } from 'react';
export function usePathname() { return useLocation().pathname; }
export function useSearchParams() { return search()[0]; }
export function useRouter() {
  const navigate = useNavigate();
  return useMemo(() => ({ push: (url: string, _options?: { scroll?: boolean }) => navigate(url, { preventScrollReset: _options?.scroll === false }), replace: (url: string, _options?: { scroll?: boolean }) => navigate(url, { replace: true, preventScrollReset: _options?.scroll === false }), back: () => navigate(-1), forward: () => navigate(1), refresh: () => window.dispatchEvent(new Event('focus')), prefetch: () => {} }), [navigate]);
}
