import { scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { AccessError } from './policy';

const derive = promisify(scrypt);
const hashPattern = /^scrypt:([a-f0-9]{32}):([a-f0-9]{128})$/;
export function credentialsConfigured(env: NodeJS.ProcessEnv) {
  return Boolean(env.OWNER_LOGIN_USERNAME?.trim() && hashPattern.test(env.OWNER_PASSWORD_HASH ?? '') &&
    env.OWNER_SESSION_SECRET_KEY && env.APP_OWNER_USER_ID && env.GITHUB_OWNER_ID);
}

export async function verifyEnvCredentials(username: unknown, password: unknown, env: NodeJS.ProcessEnv) {
  if (!credentialsConfigured(env)) throw new AccessError(503, 'credentials_not_configured');
  if (typeof username !== 'string' || typeof password !== 'string' || username.length > 128 || password.length > 1024) {
    throw new AccessError(401, 'invalid_credentials');
  }
  const [, salt, digest] = hashPattern.exec(env.OWNER_PASSWORD_HASH!)!;
  // Do the same expensive work for incorrect usernames and passwords.
  const derived = await derive(password, Buffer.from(salt, 'hex'), 64) as Buffer;
  const passwordMatches = timingSafeEqual(derived, Buffer.from(digest, 'hex'));
  if (!passwordMatches || username.trim() !== env.OWNER_LOGIN_USERNAME!.trim()) {
    throw new AccessError(401, 'invalid_credentials');
  }
}

// Single-owner deployment: bound work across all usernames, not a user-controlled map.
// This is process-local; multi-instance deployments also need an edge/shared limit.
export function loginLimiter(now = Date.now) {
  let start = now();
  let attempts = 0;
  let inFlight = false;
  return async function limited<T>(operation: () => Promise<T>) {
    const time = now();
    if (time - start >= 60_000) { start = time; attempts = 0; }
    if (inFlight || attempts >= 10) throw new AccessError(429, 'login_rate_limited');
    attempts += 1;
    inFlight = true;
    try { return await operation(); }
    finally { inFlight = false; }
  };
}
