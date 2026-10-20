import { withOwner } from '@/lib/auth/api';
// Source-code demo is disabled. Never resolve a request-supplied filesystem path.
export const GET = withOwner(() => Response.json({ code: 'source_preview_disabled' }, { status: 403 }));
