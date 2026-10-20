import { mkdirSync, writeFileSync, renameSync, rmSync, linkSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
export function atomicOutput(destination, contents, { replace = true } = {}) {
  mkdirSync(dirname(destination), { recursive: true });
  const temporary = `${destination}.${randomUUID()}.tmp`;
  try {
    writeFileSync(temporary, contents, { mode: 0o600, flag: 'wx' });
    if (replace) renameSync(temporary, destination);
    else linkSync(temporary, destination); // Exclusive publication; never overwrite local env.
  } finally { rmSync(temporary, { force: true }); }
}
