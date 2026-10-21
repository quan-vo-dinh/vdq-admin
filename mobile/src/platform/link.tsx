import { Link } from 'react-router-dom';
import { Browser } from '@capacitor/browser';
import type { AnchorHTMLAttributes } from 'react';
type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { href: string | { pathname?: string; query?: Record<string, string> }; prefetch?: boolean; replace?: boolean; scroll?: boolean; onNavigate?: () => void };
export default function PlatformLink({ href, prefetch: _prefetch, scroll: _scroll, replace, onNavigate, ...props }: Props) {
  void _prefetch; void _scroll;
  const to = typeof href === 'string' ? href : (href.pathname ?? '') + (href.query ? '?' + new URLSearchParams(href.query) : '');
  if (/^(https?:|mailto:|tel:)/i.test(to)) return <a {...props} href={to} onClick={event => { props.onClick?.(event); if (!event.defaultPrevented && /^https?:/.test(to)) { event.preventDefault(); void Browser.open({ url: to }); } }} />;
  return <Link {...props} to={to} replace={replace} onClick={event => { props.onClick?.(event); if (!event.defaultPrevented) onNavigate?.(); }} />;
}
