import {withOwner} from '@/lib/auth/api';
import {codexManagement} from '@/lib/developer/codex/server';
const handle=withOwner(codexManagement);
export {handle as GET,handle as POST};
