package dev.vodinhquan.dashboard;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
public class MainActivity extends BridgeActivity {
 @Override public void onCreate(Bundle state) {
  registerPlugin(DashboardVaultPlugin.class);
  super.onCreate(state);
 }
}
