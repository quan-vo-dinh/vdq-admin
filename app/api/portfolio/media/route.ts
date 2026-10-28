import { withOwner } from "@/lib/auth/api";
import { uploadMedia, listMedia } from "@/lib/portfolio/media";
export const GET = withOwner(() => listMedia());
export const POST = withOwner(uploadMedia);
