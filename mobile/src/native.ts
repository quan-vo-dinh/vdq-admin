import { SystemBars, SystemBarsStyle, Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Keyboard } from '@capacitor/keyboard';
import { Network } from '@capacitor/network';
import { Browser } from '@capacitor/browser';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { configureFiles } from '@/lib/platform/files';
let keyboardVisible = false;
let appActive = true;
let connected = navigator.onLine;
export const nativeActivity = { isVisible: () => appActive && document.visibilityState !== 'hidden', isOnline: () => connected && navigator.onLine };

export function dismissKeyboard() { if (!keyboardVisible) return false; void Keyboard.hide(); return true; }
async function cleanupExports() {
 const files = await Filesystem.readdir({ path: 'exports', directory: Directory.Cache }).catch(() => ({ files: [] }));
 await Promise.all(files.files.filter(file => file.mtime && Date.now() - file.mtime > 3600000).map(file => Filesystem.deleteFile({ path: 'exports/' + file.name, directory: Directory.Cache })));
}
export function configureNativeFiles() {
 if (!Capacitor.isNativePlatform()) return;
 void cleanupExports().catch(() => {});
 configureFiles(async (name, text) => {
  const safeName = name.replace(/[^a-zA-Z0-9._-]/g, '_');
  await cleanupExports();
  const path = 'exports/' + crypto.randomUUID() + '-' + safeName;
  const { uri } = await Filesystem.writeFile({ path, data: text, directory: Directory.Cache, encoding: Encoding.UTF8, recursive: true });
  // Receivers may read after chooser selection. Keep private cache up to one hour, or logout.
  await Share.share({ title: safeName, files: [uri] });
 });
}
export async function nativeListeners(callback: (url: string) => void, resume: () => void, pause: () => void) {
 const listeners: PluginListenerHandle[] = [];
 if (!Capacitor.isNativePlatform()) return () => {};
 listeners.push(await Keyboard.addListener('keyboardDidShow', () => { keyboardVisible = true; requestAnimationFrame(() => document.activeElement?.scrollIntoView({ block: 'nearest' })); }));
 listeners.push(await Keyboard.addListener('keyboardDidHide', () => { keyboardVisible = false; }));
 listeners.push(await App.addListener('appUrlOpen', ({ url }) => callback(url)));
 listeners.push(await App.addListener('appStateChange', ({ isActive }) => { appActive = isActive; if (isActive) { void cleanupExports().catch(() => {}); resume(); } else pause(); }));
 listeners.push(await Network.addListener('networkStatusChange', (status) => { connected = status.connected; window.dispatchEvent(new Event(connected ? 'online' : 'offline')); }));
 const bars = () => void SystemBars.setStyle({ style: document.documentElement.classList.contains('dark') ? SystemBarsStyle.Dark : SystemBarsStyle.Light }).catch(() => {});
 const observer = new MutationObserver(bars); observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] }); bars();
 connected = (await Network.getStatus()).connected;
 appActive = (await App.getState()).isActive;
 const launch = await App.getLaunchUrl(); if (launch?.url) callback(launch.url);
 const external = (event: MouseEvent) => {
  const anchor = (event.target as Element)?.closest?.('a');
  if (anchor && /^https?:/.test(anchor.href) && new URL(anchor.href).origin !== location.origin) { event.preventDefault(); void Browser.open({ url: anchor.href }); }
 };
 document.addEventListener('click', external, true);
 return () => { observer.disconnect(); listeners.forEach(listener => void listener.remove()); document.removeEventListener('click', external, true); };
}
