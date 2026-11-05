import { withOwner } from "@/lib/auth/api";
import { liveData } from "@/lib/developer/live/service";
export const GET = withOwner(async () => Response.json(await liveData()));
