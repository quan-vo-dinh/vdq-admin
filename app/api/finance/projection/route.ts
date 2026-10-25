import { withOwner } from "@/lib/auth/api";
import { projectionRequest } from "@/lib/finance/projection-server";
const handle = withOwner(projectionRequest);
export { handle as GET, handle as PUT, handle as DELETE };
