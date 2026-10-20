import { execFileSync } from 'node:child_process';
import { atomicOutput } from './atomic-output.mjs';
export function generateTypes(run = () => execFileSync('pnpm', ['exec', 'supabase', 'gen', 'types', 'typescript', '--local', '--schema', 'public'], { stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 8 * 1024 * 1024 }), destination = 'types/database.ts') {
  const result = run().toString().split('\n').map(line => line.trimEnd()).join('\n');
  if (!result.includes('export type Database =') || !/["']?public["']?:/.test(result)) throw new Error('CLI did not return valid database types');
  atomicOutput(destination, result);
}
if (process.argv[1] === new URL(import.meta.url).pathname) {
  try { generateTypes(); console.log('Generated types/database.ts from local public schema.'); }
  catch { console.error('Type generation failed; existing types were preserved. Check local stack.'); process.exitCode = 1; }
}
