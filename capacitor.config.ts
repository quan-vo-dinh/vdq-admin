import type { CapacitorConfig } from '@capacitor/cli';
const localHttp = process.env.CAPACITOR_DEV_HTTP === '1';
const config: CapacitorConfig = {
 appId: 'dev.vodinhquan.dashboard', appName: 'bin Dashboard', webDir: 'mobile/dist',
 server: { hostname: 'localhost', androidScheme: 'https', cleartext: localHttp },
 android: { path: 'mobile/android', allowMixedContent: localHttp, webContentsDebuggingEnabled: false },
 loggingBehavior: 'none', zoomEnabled: true,
};
export default config;
