import 'server-only';
import { requireOwner } from '@/lib/auth/owner';
import { AccessError } from '@/lib/auth/policy';
import { dbError, input, revision, uuid } from '@/lib/backend/mutations';
import { parseEvent, parseSettings } from './validation';
import { defaultSettings } from './types';
import type { Json } from '@/types/database';
const local = (value: string) => new Date(Date.parse(value) + 7 * 3600000).toISOString().slice(0,16);
export async function calendarRequest(request: Request) {
  const { supabase: db, user } = await requireOwner();
  // Idempotent creation of a single default settings row, no demo event seeding.
  const initial = await db.from('calendar_settings').insert({ id: user.id });
  if (initial.error?.code !== '23505') dbError(initial.error);
  if (request.method !== 'GET') {
    const body = await input(request);
    if (request.method === 'PATCH') {
      const value = parseSettings(body); if (!value) throw new AccessError(400, 'invalid');
      const result = await db.from('calendar_settings').update({ settings: value as unknown as NonNullable<Json> }).eq('owner_id', user.id).eq('revision', revision(body.expectedRevision)).select('id');
      dbError(result.error); if (!result.data?.length) throw new AccessError(409, 'conflict');
    } else {
      const id = uuid(body.id);
      if (request.method === 'DELETE') {
        const result = await db.from('calendar_events').delete().eq('id', id).eq('owner_id', user.id).eq('revision', revision(body.expectedRevision)).select('id');
        dbError(result.error);
        if (!result.data?.length) {
          const existing = await db.from('calendar_events').select('id').eq('id', id).eq('owner_id', user.id).maybeSingle();
          dbError(existing.error); throw new AccessError(existing.data ? 409 : 404, existing.data ? 'conflict' : 'missing');
        }
      } else {
        const value = parseEvent(body); if (!value) throw new AccessError(400, 'invalid');
        const { start, end, allDay, ...fields } = value;
        const values = { ...fields, starts_at: allDay ? null : new Date(`${start}:00+07:00`).toISOString(), ends_at: allDay ? null : new Date(`${end}:00+07:00`).toISOString(), starts_on: allDay ? start.slice(0,10) : null, ends_on: allDay ? end.slice(0,10) : null };
        if (request.method === 'POST') {
          const result = await db.from('calendar_events').insert({ id, ...values });
          if (result.error?.code === '23505') {
            const exists = await db.from('calendar_events').select('id').eq('id', id).eq('owner_id', user.id).maybeSingle();
            dbError(exists.error); if (!exists.data) throw new AccessError(409, 'conflict');
          } else dbError(result.error);
        } else {
          const result = await db.from('calendar_events').update(values).eq('id', id).eq('owner_id', user.id).eq('revision', revision(body.expectedRevision)).select('id');
          dbError(result.error);
          if (!result.data?.length) {
            const exists = await db.from('calendar_events').select('id').eq('id', id).eq('owner_id', user.id).maybeSingle();
            dbError(exists.error); throw new AccessError(exists.data ? 409 : 404, exists.data ? 'conflict' : 'missing');
          }
        }
      }
    }
  }
  let query = db.from('calendar_events').select().eq('owner_id', user.id);
  const url = new URL(request.url), from = url.searchParams.get('from'), to = url.searchParams.get('to');
  if (from || to) {
    if (!from || !to || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || to <= from || !Number.isFinite(Date.parse(from)) || !Number.isFinite(Date.parse(to))) throw new AccessError(400,'invalid_window');
    query = query.or(`and(starts_at.lt.${to}T00:00:00+07:00,ends_at.gt.${from}T00:00:00+07:00),and(starts_on.lt.${to},ends_on.gt.${from})`);
  }
  const events = await query; dbError(events.error);
  const settings = await db.from('calendar_settings').select().eq('owner_id', user.id).single(); dbError(settings.error);
  const parsedSettings = parseSettings(settings.data!.settings) ?? defaultSettings;
  return Response.json({ events: events.data!.map(row => ({ id: row.id, title: row.title, description: row.description, start: row.starts_on ? `${row.starts_on}T00:00` : local(row.starts_at!), end: row.ends_on ? `${row.ends_on}T00:00` : local(row.ends_at!), allDay: row.starts_on !== null, color: row.color, category: row.category, kind: row.kind, status: row.status, priority: row.priority, location: row.location, attendees: row.attendees, revision: row.revision })), settings: parsedSettings, settingsRevision: settings.data!.revision }, { status: request.method === 'POST' ? 201 : 200 });
}
