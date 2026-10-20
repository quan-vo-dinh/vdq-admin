import { withOwner } from '@/lib/auth/api';
import { goalImageRequest } from '@/lib/personal/media';
const handle=withOwner(goalImageRequest);
export {handle as GET,handle as POST,handle as DELETE};
