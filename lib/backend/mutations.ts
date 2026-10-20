import 'server-only';
import { AccessError } from '@/lib/auth/policy';
export function uuid(value: unknown): string {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) throw new AccessError(400, 'invalid_id');
  return value;
}
export function revision(value: unknown): number {
  if (!Number.isSafeInteger(value) || Number(value) < 1) throw new AccessError(400, 'invalid_revision');
  return Number(value);
}
export async function input(request: Request): Promise<Record<string, unknown>> {
  const text = await request.text();
  if (Buffer.byteLength(text) > 260000) throw new AccessError(400, 'payload_too_large');
  try {
    const value = JSON.parse(text);
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    return value;
  } catch { throw new AccessError(400, 'invalid'); }
}
export function dbError(error: { code?: string; message: string } | null) {
  if (!error) return;
  if (error.code === 'P0001' && ['full','missing','conflict'].includes(error.message)) throw new AccessError(error.message === 'missing' ? 404 : 409, error.message);
  if (error.code === '42501') throw new AccessError(403, 'owner_required');
  if (error.code?.startsWith('22') || error.code === '23514') throw new AccessError(400, 'invalid');
  throw new AccessError(500, 'storage_unavailable');
}
