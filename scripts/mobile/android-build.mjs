import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
const variant = process.argv[2];
if (!['debug','release','unsigned'].includes(variant)) throw new Error('Expected debug, release, or unsigned');
if (variant === 'release' && !['DASHBOARD_KEYSTORE','DASHBOARD_KEY_ALIAS','DASHBOARD_STORE_PASSWORD','DASHBOARD_KEY_PASSWORD'].every(key => process.env[key])) throw new Error('Release signing requires user-owned keystore and env credentials. No key is generated.');
if (variant !== 'debug') { const config = JSON.parse(readFileSync('mobile/android/app/src/main/assets/capacitor.config.json','utf8')); if (config.server?.url || config.server?.cleartext || config.android?.allowMixedContent) throw new Error('Release rejects live URLs or debug cleartext configuration.'); }
const java = process.env.JAVA_HOME ?? '/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home';
const sdk = process.env.ANDROID_HOME ?? '/opt/homebrew/share/android-commandlinetools';
if (!existsSync(java) || !existsSync(sdk + '/platforms/android-36')) throw new Error('Set JAVA_HOME (JDK21) and ANDROID_HOME (SDK36)');
const result = spawnSync('./gradlew', ['--no-daemon', variant === 'debug' ? 'assembleDebug' : 'assembleRelease'], { cwd: 'mobile/android', env: { ...process.env, JAVA_HOME: java, ANDROID_HOME: sdk }, stdio: 'inherit' });
process.exit(result.status ?? 1);
