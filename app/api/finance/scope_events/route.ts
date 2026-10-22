import { withOwner } from '@/lib/auth/api';
import { financeRequest } from '@/lib/finance/server';
const handle = withOwner(request => financeRequest(request, 'scope_events'));
export { handle as GET, handle as POST, handle as PATCH, handle as DELETE };
