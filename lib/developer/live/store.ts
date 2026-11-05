import "server-only";
import { serverSupabase } from "@/lib/supabase/server";
import { dbError } from "@/lib/backend/mutations";
import type { Json } from "@/types/database";
export async function documents<T>(collection: string) {
  const db = await serverSupabase();
  const { data, error } = await db
    .from("developer_documents")
    .select("id,payload")
    .eq("collection", collection);
  dbError(error);
  return (data ?? []).map((row) => ({ id: row.id, value: row.payload as T }));
}
export async function putDocument(
  collection: string,
  id: string,
  value: unknown,
) {
  const db = await serverSupabase();
  const { error } = await db.from("developer_documents").upsert(
    {
      collection,
      id,
      payload: JSON.parse(JSON.stringify(value)) as Json,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "owner_id,collection,id" },
  );
  dbError(error);
}
export async function deleteDocument(collection: string, id: string) {
  const db = await serverSupabase();
  const { error } = await db
    .from("developer_documents")
    .delete()
    .eq("collection", collection)
    .eq("id", id);
  dbError(error);
}
