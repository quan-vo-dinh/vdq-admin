import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('.', import.meta.url));
const repo = fileURLToPath(new URL('..', import.meta.url));
const forbidServer: Plugin = {
 name: 'forbid-server-in-mobile',
 resolveId(source) {
   if (source === 'server-only' || /^next(?:\/|$)/.test(source) || source.startsWith('node:')) throw new Error(`Server dependency in mobile: ${source}`);
 },
 generateBundle() {
   const forbidden = [...this.getModuleIds()].filter(id => /\/lib\/(?:auth\/(?:owner|api|env-credentials)|supabase\/server)|\/app\/api\/.*route\.ts|\/next\/dist\//.test(id));
   if (forbidden.length) throw new Error(`Server modules: ${forbidden.join(', ')}`);
 },
};
export default defineConfig(({ mode }) => {
 const env = loadEnv(mode, root, 'VITE_');
 const base = env.VITE_API_BASE_URL;
 if (!base || (new URL(base).protocol !== 'https:' && !(mode === 'development' && /^http:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2):\d+$/.test(base))) || new URL(base).pathname !== '/') throw new Error('Set mobile/.env.local VITE_API_BASE_URL to an explicit HTTPS origin (no automatic production fallback)');
 return {
 root, envDir: root, server: { host: 'localhost', port: 5173, strictPort: true, watch: { ignored: ['**/mobile/android/**', '**/mobile/dist/**', '**/mobile/preview/**', '**/.next/**', '**/test-results/**', '**/docs/**'] } }, publicDir: repo + '/public', plugins: [forbidServer, react()],
 resolve: { alias: [
  ...['navigation', 'link', 'image', 'error-boundary'].map(name => ({ find: `@/lib/platform/${name}`, replacement: root + `src/platform/${name}.tsx` })),
  { find: '@/app/components/auth/logout-button', replacement: root + 'src/logout-button.tsx' },
  { find: '@', replacement: repo },
 ] },
 build: { outDir: 'dist', emptyOutDir: true, sourcemap: false, manifest: true },
 };
});
