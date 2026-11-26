package com.antarctic.tv;

import android.graphics.Color;
import android.os.Bundle;
import android.os.SystemClock;
import android.view.InputDevice;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.FrameLayout;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private View customView;
    private WebChromeClient.CustomViewCallback customViewCallback;
    private FrameLayout fullscreenContainer;

    private volatile boolean isPlayerActive = false;
    private volatile boolean isHudVisible = true;
    private volatile boolean isPointerMode = false;

    // Normalized cursor position (0.0 to 1.0)
    private float normX = 0.5f;
    private float normY = 0.5f;

    public class TvRemoteBridge {
        @JavascriptInterface
        public void setPlayerState(boolean playerActive, boolean hudVisible) {
            isPlayerActive = playerActive;
            isHudVisible = hudVisible;
        }

        @JavascriptInterface
        public void setPointerMode(boolean enabled) {
            runOnUiThread(() -> {
                isPointerMode = enabled;
                if (enabled) {
                    WebView wv = getBridge() != null ? getBridge().getWebView() : null;
                    if (wv != null) {
                        wv.evaluateJavascript("window.__setTvCursor && window.__setTvCursor(" + normX + "," + normY + ")", null);
                        simulateHover(wv, normX * wv.getWidth(), normY * wv.getHeight());
                    }
                }
            });
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        enableImmersiveMode();

        WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.setFocusable(true);
            webView.setFocusableInTouchMode(true);
            webView.requestFocus();
            webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
            webView.addJavascriptInterface(new TvRemoteBridge(), "AntarcticTvBridge");

            WebSettings settings = webView.getSettings();
            settings.setMediaPlaybackRequiresUserGesture(false);
            settings.setJavaScriptCanOpenWindowsAutomatically(false);
            settings.setSupportMultipleWindows(false);

            webView.setWebChromeClient(new WebChromeClient() {
                @Override
                public void onShowCustomView(View view, CustomViewCallback callback) {
                    if (customView != null) {
                        callback.onCustomViewHidden();
                        return;
                    }
                    customView = view;
                    customViewCallback = callback;

                    fullscreenContainer = new FrameLayout(MainActivity.this);
                    fullscreenContainer.setBackgroundColor(Color.BLACK);
                    fullscreenContainer.addView(
                        customView,
                        new FrameLayout.LayoutParams(
                            ViewGroup.LayoutParams.MATCH_PARENT,
                            ViewGroup.LayoutParams.MATCH_PARENT
                        )
                    );

                    FrameLayout rootDecor = (FrameLayout) getWindow().getDecorView();
                    rootDecor.addView(
                        fullscreenContainer,
                        new FrameLayout.LayoutParams(
                            ViewGroup.LayoutParams.MATCH_PARENT,
                            ViewGroup.LayoutParams.MATCH_PARENT
                        )
                    );
                    enableImmersiveMode();
                }

                @Override
                public void onHideCustomView() {
                    if (customView == null) return;
                    FrameLayout rootDecor = (FrameLayout) getWindow().getDecorView();
                    if (fullscreenContainer != null) {
                        rootDecor.removeView(fullscreenContainer);
                    }
                    fullscreenContainer = null;
                    customView = null;
                    if (customViewCallback != null) {
                        customViewCallback.onCustomViewHidden();
                        customViewCallback = null;
                    }
                    enableImmersiveMode();
                }
            });
        }
    }

    private void simulateHover(WebView webView, float x, float y) {
        long now = SystemClock.uptimeMillis();
        MotionEvent hover = MotionEvent.obtain(now, now, MotionEvent.ACTION_HOVER_MOVE, x, y, 0);
        hover.setSource(InputDevice.SOURCE_MOUSE);
        webView.dispatchGenericMotionEvent(hover);
        hover.recycle();
    }

    private void simulateTap(WebView webView, float x, float y) {
        long downTime = SystemClock.uptimeMillis();
        MotionEvent down = MotionEvent.obtain(downTime, downTime, MotionEvent.ACTION_DOWN, x, y, 0);
        MotionEvent up = MotionEvent.obtain(downTime, downTime + 45, MotionEvent.ACTION_UP, x, y, 0);
        webView.dispatchTouchEvent(down);
        webView.dispatchTouchEvent(up);
        down.recycle();
        up.recycle();
    }

    private void simulateDoubleTap(final WebView webView, final float x, final float y) {
        simulateTap(webView, x, y);
        webView.postDelayed(() -> simulateTap(webView, x, y), 110);
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        WebView webView = getBridge() != null ? getBridge().getWebView() : null;

        if (webView != null && isPointerMode) {
            int code = event.getKeyCode();
            boolean isPointerKey = code == KeyEvent.KEYCODE_DPAD_LEFT
                || code == KeyEvent.KEYCODE_DPAD_RIGHT
                || code == KeyEvent.KEYCODE_DPAD_UP
                || code == KeyEvent.KEYCODE_DPAD_DOWN
                || code == KeyEvent.KEYCODE_DPAD_CENTER
                || code == KeyEvent.KEYCODE_ENTER
                || code == KeyEvent.KEYCODE_BACK;

            if (isPointerKey) {
                if (event.getAction() == KeyEvent.ACTION_DOWN) {
                    float stepX = 0.028f;
                    float stepY = 0.04f;
                    float w = Math.max(1f, webView.getWidth());
                    float h = Math.max(1f, webView.getHeight());

                    boolean moved = false;
                    if (code == KeyEvent.KEYCODE_DPAD_LEFT) {
                        normX = Math.max(0.01f, normX - stepX);
                        moved = true;
                    } else if (code == KeyEvent.KEYCODE_DPAD_RIGHT) {
                        normX = Math.min(0.99f, normX + stepX);
                        moved = true;
                    } else if (code == KeyEvent.KEYCODE_DPAD_UP) {
                        normY = Math.max(0.01f, normY - stepY);
                        moved = true;
                    } else if (code == KeyEvent.KEYCODE_DPAD_DOWN) {
                        normY = Math.min(0.99f, normY + stepY);
                        moved = true;
                    }

                    if (moved) {
                        webView.evaluateJavascript("window.__setTvCursor && window.__setTvCursor(" + normX + "," + normY + ")", null);
                        simulateHover(webView, normX * w, normY * h);
                    } else if (code == KeyEvent.KEYCODE_DPAD_CENTER || code == KeyEvent.KEYCODE_ENTER) {
                        simulateTap(webView, normX * w, normY * h);
                    } else if (code == KeyEvent.KEYCODE_BACK) {
                        isPointerMode = false;
                        webView.evaluateJavascript("window.__onTvPointerExit && window.__onTvPointerExit()", null);
                    }
                }
                // Consume both ACTION_DOWN and ACTION_UP so WebView/Back doesn't hijack pointer keys
                return true;
            }
        }

        if (webView != null && isPlayerActive && !isHudVisible && event.getAction() == KeyEvent.ACTION_DOWN) {
            int code = event.getKeyCode();
            float w = webView.getWidth();
            float h = webView.getHeight();

            if (code == KeyEvent.KEYCODE_DPAD_UP || code == KeyEvent.KEYCODE_MENU) {
                webView.requestFocus();
                webView.evaluateJavascript("window.__showTvHud && window.__showTvHud()", null);
                return true;
            }

            if (code == KeyEvent.KEYCODE_DPAD_CENTER
                || code == KeyEvent.KEYCODE_ENTER
                || code == KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE
                || code == KeyEvent.KEYCODE_MEDIA_PLAY
                || code == KeyEvent.KEYCODE_MEDIA_PAUSE) {
                simulateTap(webView, w * 0.5f, h * 0.5f);
                return true;
            }

            if (code == KeyEvent.KEYCODE_DPAD_RIGHT || code == KeyEvent.KEYCODE_MEDIA_FAST_FORWARD) {
                simulateDoubleTap(webView, w * 0.78f, h * 0.5f);
                return true;
            }

            if (code == KeyEvent.KEYCODE_DPAD_LEFT || code == KeyEvent.KEYCODE_MEDIA_REWIND) {
                simulateDoubleTap(webView, w * 0.22f, h * 0.5f);
                return true;
            }
        }

        return super.dispatchKeyEvent(event);
    }

    private void enableImmersiveMode() {
        View decorView = getWindow().getDecorView();
        decorView.setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_FULLSCREEN
        );
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            enableImmersiveMode();
        }
    }
}
