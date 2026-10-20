import { createRequire } from 'node:module';
import { loadValidator } from './env.mjs';
// Use Next's installed env loader, including .env.local precedence. No env values logged.
createRequire(createRequire(import.meta.url).resolve('next/package.json'))('@next/env').loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
try {
  const config = loadValidator()(process.env);
  console.log(`Backend environment valid: ${config.mode}. No network request performed.`);
} catch (error) { console.error(error.message); process.exitCode = 1; }
