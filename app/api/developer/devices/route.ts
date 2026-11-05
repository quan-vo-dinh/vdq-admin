import { withOwner } from "@/lib/auth/api";
import { deviceRequest } from "@/lib/developer/live/devices";
const handle = withOwner(deviceRequest);
export { handle as GET, handle as POST, handle as DELETE };
