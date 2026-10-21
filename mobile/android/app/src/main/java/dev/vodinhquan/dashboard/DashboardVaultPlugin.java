package dev.vodinhquan.dashboard;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.nio.charset.StandardCharsets;
import java.io.File;
import java.security.KeyStore;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

/** Small app-owned AES-GCM vault. Non-exportable key in Android Keystore.
 *  Ciphertext is committed atomically; Android backup is disabled for this app. */
@CapacitorPlugin(name = "DashboardVault")
public class DashboardVaultPlugin extends Plugin {
 private static final String ALIAS = "dashboard.session.v1";
 private SharedPreferences prefs() { return getContext().getSharedPreferences("dashboard-vault", Context.MODE_PRIVATE); }
 private synchronized SecretKey key() throws Exception {
  KeyStore store = KeyStore.getInstance("AndroidKeyStore"); store.load(null);
  if (!store.containsAlias(ALIAS)) {
   KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
   generator.init(new KeyGenParameterSpec.Builder(ALIAS, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT).setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).build());
   return generator.generateKey();
  }
  return (SecretKey) store.getKey(ALIAS, null);
 }
 @PluginMethod public synchronized void get(PluginCall call) {
  try {
   String name = call.getString("key"); if (name == null) throw new Exception();
   String value = prefs().getString(name, null); JSObject result = new JSObject();
   if (value == null) result.put("value", JSObject.NULL);
   else {
    String[] parts = value.split(":", 2); Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
    cipher.init(Cipher.DECRYPT_MODE, key(), new GCMParameterSpec(128, Base64.decode(parts[0], Base64.NO_WRAP)));
    cipher.updateAAD(name.getBytes(StandardCharsets.UTF_8));
    result.put("value", new String(cipher.doFinal(Base64.decode(parts[1], Base64.NO_WRAP)), StandardCharsets.UTF_8));
   }
   call.resolve(result);
  } catch (Exception ignored) { call.reject("Secure session unavailable. Sign in again."); }
 }
 @PluginMethod public synchronized void set(PluginCall call) {
  try {
   String name = call.getString("key"), value = call.getString("value"); if (name == null || value == null) throw new Exception();
   Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding"); cipher.init(Cipher.ENCRYPT_MODE, key()); cipher.updateAAD(name.getBytes(StandardCharsets.UTF_8));
   String encrypted = Base64.encodeToString(cipher.getIV(), Base64.NO_WRAP) + ":" + Base64.encodeToString(cipher.doFinal(value.getBytes(StandardCharsets.UTF_8)), Base64.NO_WRAP);
   if (!prefs().edit().putString(name, encrypted).commit()) throw new Exception(); call.resolve();
  } catch (Exception ignored) { call.reject("Cannot store secure session."); }
 }
 @PluginMethod public synchronized void remove(PluginCall call) { if (prefs().edit().remove(call.getString("key", "")).commit()) call.resolve(); else call.reject("Cannot remove session."); }
 private void deleteExports() {
  File directory = new File(getContext().getCacheDir(), "exports");
  File[] files = directory.listFiles(); if (files != null) for (File file : files) file.delete();
 }
 @PluginMethod public synchronized void clear(PluginCall call) {
  if (!prefs().edit().clear().commit()) { call.reject("Cannot clear session."); return; }
  deleteExports();
  getActivity().runOnUiThread(() -> { getBridge().getWebView().clearCache(true); call.resolve(); });
 }
}
