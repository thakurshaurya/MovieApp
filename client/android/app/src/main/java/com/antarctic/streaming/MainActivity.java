package com.antarctic.streaming;

import android.os.Bundle;
import android.view.KeyEvent;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Ensure WebView can take focus for D-Pad navigation
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.setFocusable(true);
            webView.setFocusableInTouchMode(true);
            webView.requestFocus();

            // Defense-in-depth: prevent third-party embeds from opening popup windows
            WebSettings settings = webView.getSettings();
            settings.setJavaScriptCanOpenWindowsAutomatically(false);
            settings.setSupportMultipleWindows(false);
        }
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        // Forward D-Pad and Media keys to WebView for rich spatial navigation
        return super.dispatchKeyEvent(event);
    }
}
