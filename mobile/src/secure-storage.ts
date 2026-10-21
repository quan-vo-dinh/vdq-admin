import { apiBase } from './config';
import { Capacitor, registerPlugin } from '@capacitor/core';
interface Vault { get(options: { key: string }): Promise<{ value: string | null }>; set(options: { key: string; value: string }): Promise<void>; remove(options: { key: string }): Promise<void>; clear(): Promise<void> }
const vault = registerPlugin<Vault>('DashboardVault');
// Browser preview deliberately cannot retain a session across process restart.
const preview = new Map<string, string>();
const scopedKey = (key: string) => new URL(apiBase).origin + ':' + key;
export const secureStorage = {
 async get(key: string) { return Capacitor.isNativePlatform() ? (await vault.get({ key: scopedKey(key) })).value : preview.get(scopedKey(key)) ?? null; },
 async set(key: string, value: string) { if (Capacitor.isNativePlatform()) await vault.set({ key: scopedKey(key), value }); else preview.set(scopedKey(key), value); },
 async remove(key: string) { if (Capacitor.isNativePlatform()) await vault.remove({ key: scopedKey(key) }); else preview.delete(scopedKey(key)); },
 async clear() { if (Capacitor.isNativePlatform()) await vault.clear(); else preview.clear(); },
};
