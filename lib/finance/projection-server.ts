import "server-only";
import { requireOwner } from "@/lib/auth/owner";
import { AccessError } from "@/lib/auth/policy";
import { input, uuid, revision, dbError } from "@/lib/backend/mutations";
import { validateSavingsPlan } from "./projection";
export async function projectionRequest(request: Request) {
  const { supabase: db, user } = await requireOwner();
  if (request.method === "GET") {
    const result = await db
      .from("finance_projection_plans")
      .select("id,revision,plan")
      .eq("owner_id", user.id)
      .maybeSingle();
    dbError(result.error);
    if (result.data) {
      try {
        result.data.plan = validateSavingsPlan(
          result.data.plan,
        );
      } catch {
        throw new AccessError(500, "invalid_saved_projection");
      }
    }
    return Response.json({ saved: result.data });
  }
  const body = await input(request),
    id = uuid(body.id);
  const table = db.from("finance_projection_plans");
  if (request.method === "DELETE") {
    const result = await table
      .delete()
      .eq("owner_id", user.id)
      .eq("id", id)
      .eq("revision", revision(body.expectedRevision))
      .select("id");
    dbError(result.error);
    if (!result.data?.length) throw new AccessError(409, "conflict");
    return Response.json({ saved: null });
  }
  let plan;
  try {
    plan = validateSavingsPlan(body.plan);
  } catch {
    throw new AccessError(400, "invalid_projection");
  }
  const result =
    body.expectedRevision === 0
      ? await table
          .insert({ id, plan })
          .select("id,revision,plan")
          .single()
      : await table
          .update({ plan })
          .eq("owner_id", user.id)
          .eq("id", id)
          .eq("revision", revision(body.expectedRevision))
          .select("id,revision,plan")
          .maybeSingle();
  if (result.error?.code === "23505") throw new AccessError(409, "conflict");
  dbError(result.error);
  if (!result.data) throw new AccessError(409, "conflict");
  return Response.json({ saved: result.data });
}
