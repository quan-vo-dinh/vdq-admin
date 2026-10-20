import { withOwner } from '@/lib/auth/api';
import { learningRequest } from '@/lib/learning/server';
const handle = withOwner(request => learningRequest(request, 'habits'));
export { handle as GET, handle as POST, handle as PATCH };
