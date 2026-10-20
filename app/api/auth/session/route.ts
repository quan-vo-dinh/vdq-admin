import { withOwner } from '@/lib/auth/api';
import { requireOwner } from '@/lib/auth/owner';
export const GET = withOwner(async () => {
  const { user } = await requireOwner();
  return Response.json({ user: { id: user.id, provider: 'github' } });
});
