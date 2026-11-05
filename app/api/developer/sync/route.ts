import { withOwner } from "@/lib/auth/api";
import { syncRequest } from "@/lib/developer/live/service";
export const POST = withOwner(syncRequest);
