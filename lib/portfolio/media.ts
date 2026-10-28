import "server-only";
import sharp from "sharp";
import { requireOwner } from "@/lib/auth/owner";
import { AccessError } from "@/lib/auth/policy";
import { dbError, uuid } from "@/lib/backend/mutations";
import { publicPortfolioClient } from "./public";
const bucket = "portfolio-media",
  max = 2 * 1024 * 1024;
export async function uploadMedia(request: Request) {
  const { supabase: db, user } = await requireOwner();
  const reader = request.body?.getReader();
  if (!reader) throw new AccessError(400, "invalid_image");
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const r = await reader.read();
    if (r.done) break;
    size += r.value.length;
    if (size > max) {
      await reader.cancel();
      throw new AccessError(413, "image_too_large");
    }
    chunks.push(r.value);
  }
  let encoded: Buffer;
  try {
    const image = sharp(Buffer.concat(chunks), {
      limitInputPixels: 16_000_000,
      animated: false,
      failOn: "warning",
    });
    const m = await image.metadata();
    if (!["jpeg", "png", "webp"].includes(m.format ?? "") || (m.pages ?? 1) > 1)
      throw new Error();
    encoded = await image.rotate().webp({ quality: 85 }).toBuffer();
    if (encoded.length > max) throw new Error();
  } catch {
    throw new AccessError(400, "invalid_image");
  }
  const id = crypto.randomUUID(),
    path = `${user.id}/portfolio/${id}.webp`;
  const uploaded = await db.storage
    .from(bucket)
    .upload(path, encoded, {
      contentType: "image/webp",
      upsert: false,
      cacheControl: "0",
    });
  if (uploaded.error) throw new AccessError(503, "image_upload_failed");
  const result = await db
    .from("portfolio_media")
    .insert({ id, path, mime: "image/webp", bytes: encoded.length })
    .select()
    .single();
  // Immutable objects are retained. If registration fails the owner can retry registration through recovery tooling; no unrelated object is deleted.
  dbError(result.error);
  return Response.json({ media: result.data }, { status: 201 });
}
export async function listMedia() {
  const { supabase: db } = await requireOwner();
  const r = await db
    .from("portfolio_media")
    .select()
    .order("created_at", { ascending: false });
  dbError(r.error);
  return Response.json({ media: r.data });
}
export async function readMedia(idValue: string, isPublic: boolean) {
  const id = uuid(idValue);
  const db = isPublic
    ? publicPortfolioClient()
    : (await requireOwner()).supabase;
  let path: string | undefined;
  if (isPublic) {
    const r = await db.rpc("read_published_portfolio_media", { media_id: id });
    dbError(r.error);
    path = r.data?.[0]?.path;
  } else {
    const r = await db
      .from("portfolio_media")
      .select("path")
      .eq("id", id)
      .maybeSingle();
    dbError(r.error);
    path = r.data?.path;
  }
  if (!path) throw new AccessError(404, "missing");
  const r = await db.storage.from(bucket).download(path);
  if (r.error) throw new AccessError(503, "image_unavailable");
  return new Response(r.data, {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": isPublic
        ? "public, max-age=0, must-revalidate"
        : "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
export async function reconcileMedia() {
  const { supabase: db, user } = await requireOwner();
  const r = await db.storage
    .from(bucket)
    .list(`${user.id}/portfolio`, { limit: 1000 });
  if (r.error) throw new AccessError(503, "media_unavailable");
  let recovered = 0;
  for (const object of r.data) {
    if (!/^[0-9a-f-]{36}\.webp$/.test(object.name)) continue;
    const id = object.name.slice(0, -5);
    const found = await db
      .from("portfolio_media")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    dbError(found.error);
    if (found.data) continue;
    const path = `${user.id}/portfolio/${object.name}`;
    const file = await db.storage.from(bucket).download(path);
    if (file.error) continue;
    try {
      const bytes = Buffer.from(await file.data.arrayBuffer());
      const m = await sharp(bytes, { limitInputPixels: 16_000_000 }).metadata();
      if (m.format !== "webp" || bytes.length > max) continue;
      const saved = await db
        .from("portfolio_media")
        .insert({ id, path, mime: "image/webp", bytes: bytes.length });
      if (!saved.error) recovered++;
    } catch {
      /* Leave invalid objects untouched for operator review. */
    }
  }
  return Response.json({ recovered });
}
