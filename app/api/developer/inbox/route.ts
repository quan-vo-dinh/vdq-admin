import { withOwner } from "@/lib/auth/api";
import { inboxRequest } from "@/lib/developer/live/service";
export const PATCH = withOwner(inboxRequest);
