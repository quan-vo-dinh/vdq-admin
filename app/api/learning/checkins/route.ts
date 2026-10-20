import { withOwner } from '@/lib/auth/api';
import { learningRequest } from '@/lib/learning/server';
const handle = withOwner(request => learningRequest(request, 'checkins'));
export { handle as GET, handle as POST, handle as PATCH, handle as DELETE };
