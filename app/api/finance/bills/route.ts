import { withOwner } from '@/lib/auth/api';
import { financeRequest } from '@/lib/finance/server';
const handle = withOwner(request => financeRequest(request, 'bills'));
export { handle as POST, handle as PATCH, handle as DELETE, handle as GET };
