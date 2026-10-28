import "server-only";
import { requireOwner } from "@/lib/auth/owner";
import { input, dbError, revision, uuid } from "@/lib/backend/mutations";
import { revalidateTag, revalidatePath } from "next/cache";
import { parseDocument } from "./model";
import type { Json } from "@/types/database";
export async function draftPortfolio() {
  const { supabase: db } = await requireOwner();
  const result = await db.from("portfolio_sites").select().maybeSingle();
  dbError(result.error);
  return result.data
    ? { ...result.data, draft: parseDocument(result.data.draft) }
    : null;
}
export async function portfolioRequest(
  request: Request,
  action: "draft" | "publish" | "history" | "restore" | "refresh",
) {
  const { supabase: db } = await requireOwner();
  if (request.method === "GET") {
    if (action === "history") {
      const r = await db
        .from("portfolio_versions")
        .select("id,created_at,draft_revision")
        .order("created_at", { ascending: false });
      dbError(r.error);
      return Response.json({ versions: r.data });
    }
    return Response.json({ site: await draftPortfolio() });
  }
  if (action === "refresh")
    return Response.json({ cacheRefreshPending: refresh() });
  const body = await input(request);
  if (action === "draft") {
    let doc;
    try {
      doc = parseDocument(body.document);
    } catch (error) {
      return Response.json(
        {
          code: "invalid_document",
          detail: error instanceof Error ? error.message : "Invalid document",
        },
        { status: 400 },
      );
    }
    const expected =
      body.expectedRevision === 0 ? 0 : revision(body.expectedRevision);
    const r = await db.rpc("save_portfolio", {
      doc: doc as unknown as Json,
      expected_revision: expected,
    });
    dbError(r.error);
    return Response.json({ site: r.data });
  }
  const r = await db.rpc("publish_portfolio", {
    expected_revision: revision(body.expectedRevision),
    ...(action === "restore" ? { restore_id: uuid(body.versionId) } : {}),
  });
  dbError(r.error);
  return Response.json({
    version: r.data,
    site: await draftPortfolio(),
    cacheRefreshPending: refresh(),
  });
}
function refresh() {
  try {
    revalidateTag("portfolio-published", { expire: 0 });
    revalidatePath("/");
    return false;
  } catch {
    return true;
  }
}
