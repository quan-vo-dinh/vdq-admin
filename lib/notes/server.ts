import 'server-only';
import { requireOwner } from '@/lib/auth/owner';
import { AccessError } from '@/lib/auth/policy';
import { dbError, input, revision, uuid } from '@/lib/backend/mutations';
import { parseNoteUpdate, plainDocument } from './model';
import type { Database, Json } from '@/types/database';
type Row = Database['public']['Tables']['notes']['Row'];
function note(row: Row) {
  // Data API writes are untrusted too. Never hand arbitrary nodes/attrs to Tiptap.
  let content;
  try { content = parseNoteUpdate({ content: row.content }).content; }
  catch { content = plainDocument('Unsupported note content. Please replace it with a supported document.'); }
  return { id: row.id, title: row.title, content, color: row.color, datef: row.note_at, createdAt: row.created_at, updatedAt: row.updated_at, revision: row.revision, deleted: false };
}
export async function notesRequest(request: Request) {
  const { supabase: db, user } = await requireOwner();
  let item: ReturnType<typeof note> | undefined;
  if (request.method !== 'GET') {
    const body = await input(request);
    const id = uuid(body.id);
    if (request.method === 'POST' || request.method === 'PUT') {
      let update;
      try { update = parseNoteUpdate(body); } catch { throw new AccessError(400, 'invalid'); }
      const values = { ...(update.title !== undefined && { title: update.title }), ...(update.content !== undefined && { content: update.content as NonNullable<Json> }), ...(update.color !== undefined && { color: update.color }), ...(update.datef !== undefined && { note_at: update.datef }) };
      if (request.method === 'POST') {
        if (!update.title) throw new AccessError(400, 'invalid');
        const created = await db.from('notes').insert({ ...values, id, title: update.title }).select().single();
        if (created.error?.code === '23505') {
          const existing = await db.from('notes').select().eq('id', id).eq('owner_id', user.id).single();
          dbError(existing.error); item = note(existing.data!);
        } else { dbError(created.error); item = note(created.data!); }
      } else {
        const result = await db.from('notes').update(values).eq('id', id).eq('owner_id', user.id).eq('revision', revision(body.expectedRevision)).select();
        dbError(result.error);
        if (!result.data?.length) {
          const existing = await db.from('notes').select('id').eq('id', id).eq('owner_id', user.id).maybeSingle();
          dbError(existing.error); throw new AccessError(existing.data ? 409 : 404, existing.data ? 'conflict' : 'missing');
        }
        item = note(result.data[0]);
      }
    } else {
      const result = await db.from('notes').delete().eq('id', id).eq('owner_id', user.id).eq('revision', revision(body.expectedRevision)).select('id');
      dbError(result.error);
      if (!result.data?.length) {
        const existing = await db.from('notes').select('id').eq('id', id).eq('owner_id', user.id).maybeSingle();
        dbError(existing.error); throw new AccessError(existing.data ? 409 : 404, existing.data ? 'conflict' : 'missing');
      }
    }
  }
  const result = await db.from('notes').select().eq('owner_id', user.id).order('note_at', { ascending: false }).order('id');
  dbError(result.error);
  return Response.json({ status: 200, msg: 'Success', data: result.data!.map(note), ...(item && { item }) }, { status: request.method === 'POST' ? 201 : 200 });
}
