import 'server-only';
import { requireOwner } from '@/lib/auth/owner';
import { AccessError } from '@/lib/auth/policy';
import { dbError, input, revision, uuid } from '@/lib/backend/mutations';
import { parsePriority, validDay } from './model';
export async function todayRequest(request: Request) {
  const { supabase: db, user } = await requireOwner();
  if (request.method !== 'GET') {
    const body = await input(request); const id = uuid(body.id);
    if (request.method === 'POST') {
      let value;
      try { value = parsePriority(body); } catch { throw new AccessError(400, 'invalid'); }
      dbError((await db.rpc('create_today', { p_id: id, p_date: value.date, p_title: value.title, p_category: value.category })).error);
    } else if (request.method === 'PATCH' && body.action === 'move') {
      if (!validDay(body.date)) throw new AccessError(400, 'invalid');
      dbError((await db.rpc('move_today', { p_id: id, p_date: body.date, p_revision: revision(body.expectedRevision) })).error);
    } else {
      const expected = revision(body.expectedRevision);
      const base = request.method === 'DELETE' ? db.from('today_items').delete() :
        body.action === 'toggle' && typeof body.done === 'boolean' ? db.from('today_items').update({ done: body.done }) : null;
      if (!base) throw new AccessError(400, 'invalid');
      const result = await base.eq('id', id).eq('owner_id', user.id).eq('revision', expected).select('id');
      dbError(result.error);
      if (!result.data?.length) {
        const exists = await db.from('today_items').select('id').eq('id', id).eq('owner_id', user.id).maybeSingle();
        dbError(exists.error); throw new AccessError(exists.data ? 409 : 404, exists.data ? 'conflict' : 'missing');
      }
    }
  }
  // Activity and waiting priorities span dates; do not silently limit this to today.
  const result = await db.from('today_items').select().eq('owner_id', user.id).order('item_date').order('slot');
  dbError(result.error);
  return Response.json(result.data!.map(row => ({ id: row.id, title: row.title, category: row.category, date: row.item_date, done: row.done, revision: row.revision })), { status: request.method === 'POST' ? 201 : 200 });
}
