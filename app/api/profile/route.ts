import { withOwner } from '@/lib/auth/api';
import { personalRequest } from '@/lib/personal/server';
const handle=withOwner(r=>personalRequest(r,'profiles'));
export {handle as GET,handle as PATCH};
