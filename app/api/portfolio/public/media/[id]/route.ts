import { accessFailure } from "@/lib/auth/api";
import { readMedia } from "@/lib/portfolio/media";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    return await readMedia((await params).id, true);
  } catch (e) {
    return accessFailure(e);
  }
}
