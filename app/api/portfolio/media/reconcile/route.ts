import { withOwner } from "@/lib/auth/api";
import { reconcileMedia } from "@/lib/portfolio/media";
export const POST = withOwner(() => reconcileMedia());
