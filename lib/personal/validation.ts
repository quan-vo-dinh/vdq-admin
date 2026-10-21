import { AccessError } from '../auth/policy';

export const personalKeys = ['firstName','lastName','email','phone','position','facebook','linkedin','github','instagram'];
export const addressKeys = ['location','state','pin','zip','taxNo'];
const socials = new Set(['facebook','linkedin','github','instagram']);

export function profileFields(value: unknown, keys: string[]) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new AccessError(400, 'invalid');
  return Object.fromEntries(Object.entries(value).map(([key, raw]) => {
    if (!keys.includes(key) || typeof raw !== 'string' || raw.length > 500) throw new AccessError(400, 'invalid');
    let text = raw.trim();
    if (socials.has(key) && text) {
      try {
        const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(text);
        if (!hasScheme && (!text.split('/')[0].includes('.') || text.startsWith('/'))) throw new Error();
        const url = new URL(hasScheme ? text : `https://${text}`);
        if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || /\s/.test(text)) throw new Error();
        text = url.href;
      } catch { throw new AccessError(400, 'invalid_url'); }
    }
    if (key === 'email' && text && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) throw new AccessError(400, 'invalid_email');
    return [key, text];
  })) as Record<string, string>;
}
