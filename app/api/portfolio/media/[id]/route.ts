import { withOwner } from "@/lib/auth/api";
import { readMedia } from "@/lib/portfolio/media";
export const GET = withOwner(async (request) =>
  readMedia(new URL(request.url).pathname.split("/").at(-1)!, false),
);
