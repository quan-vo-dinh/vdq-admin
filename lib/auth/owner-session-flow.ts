import { AccessError } from './policy';

type OwnerAccount = { id: string; email?: string; confirmed: boolean; githubId: string };
type SessionOperations = {
  owner(): Promise<OwnerAccount | null>;
  token(email: string): Promise<{ ownerId: string; hash: string } | null>;
  verify(hash: string): Promise<{ userId?: string; issued: boolean }>;
  authorize(): Promise<unknown>;
  revoke(): Promise<unknown>;
};

// Keep the security sequence testable independently of cookies and SDK transport.
export async function completeOwnerSession(ownerId: string, githubId: string, operations: SessionOperations) {
  let issued = false;
  try {
    const owner = await operations.owner();
    if (!owner || owner.id !== ownerId || !owner.email || !owner.confirmed || owner.githubId !== githubId) throw new Error();
    const token = await operations.token(owner.email);
    if (!token || token.ownerId !== ownerId || !token.hash) throw new Error();
    const session = await operations.verify(token.hash);
    issued = session.issued;
    if (!issued || session.userId !== ownerId) throw new Error();
    await operations.authorize();
  } catch {
    if (issued) await operations.revoke();
    throw new AccessError(503, 'owner_session_unavailable');
  }
}
