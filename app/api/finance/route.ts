import { withOwner } from '@/lib/auth/api';
import { financeRequest } from '@/lib/finance/server';
export const GET = withOwner(request => financeRequest(request));
