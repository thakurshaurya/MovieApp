package com.antarctic.tv;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.os.Bundle;
import android.os.SystemClock;
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

    private CursorOverlayView cursorOverlay;
    private float cursorX = 400f;
    private float cursorY = 300f;

    private static class CursorOverlayView extends View {
        private float cx = 400f;
        private float cy = 300f;
        private final Paint fillPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Paint strokePaint = new Paint(Paint.ANTI_ALIAS_FLAG);

        public CursorOverlayView(Context context) {
            super(context);
            fillPaint.setColor(Color.parseColor("#00E5FF"));
            fillPaint.setStyle(Paint.Style.FILL);
            strokePaint.setColor(Color.WHITE);
            strokePaint.setStyle(Paint.Style.STROKE);
            strokePaint.setStrokeWidth(4f);
        }

        public void updatePos(float x, float y) {
            cx = x;
            cy = y;
            invalidate();
        }

        @Override
        protected void onDraw(Canvas canvas) {
            super.onDraw(canvas);
            canvas.drawCircle(cx, cy, 12f, fillPaint);
            canvas.drawCircle(cx, cy, 12f, strokePaint);
        }
    }

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
                if (cursorOverlay != null) {
                    if (enabled) {
                        WebView wv = getBridge() != null ? getBridge().getWebView() : null;
                        if (wv != null && cursorX <= 1f && cursorY <= 1f) {
                            cursorX = wv.getWidth() * 0.5f;
                            cursorY = wv.getHeight() * 0.5f;
                        }
                        cursorOverlay.updatePos(cursorX, cursorY);
                        cursorOverlay.setVisibility(View.VISIBLE);
                    } else {
                        cursorOverlay.setVisibility(View.GONE);
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

            // Lightweight native cursor overlay for clicking inside cross-origin player iframes
            cursorOverlay = new CursorOverlayView(this);
            cursorOverlay.setVisibility(View.GONE);
            FrameLayout root = (FrameLayout) getWindow().getDecorView();
            root.addView(
                cursorOverlay,
                new FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )
            );

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

        if (webView != null && isPointerMode && event.getAction() == KeyEvent.ACTION_DOWN) {
            int code = event.getKeyCode();
            float step = 36f;
            float maxX = Math.max(100f, webView.getWidth() - 10f);
            float maxY = Math.max(100f, webView.getHeight() - 10f);

            if (code == KeyEvent.KEYCODE_DPAD_LEFT) {
                cursorX = Math.max(10f, cursorX - step);
                cursorOverlay.updatePos(cursorX, cursorY);
                return true;
            }
            if (code == KeyEvent.KEYCODE_DPAD_RIGHT) {
                cursorX = Math.min(maxX, cursorX + step);
                cursorOverlay.updatePos(cursorX, cursorY);
                return true;
            }
            if (code == KeyEvent.KEYCODE_DPAD_UP) {
                cursorY = Math.max(10f, cursorY - step);
                cursorOverlay.updatePos(cursorX, cursorY);
                return true;
            }
            if (code == KeyEvent.KEYCODE_DPAD_DOWN) {
                cursorY = Math.min(maxY, cursorY + step);
                cursorOverlay.updatePos(cursorX, cursorY);
                return true;
            }
            if (code == KeyEvent.KEYCODE_DPAD_CENTER || code == KeyEvent.KEYCODE_ENTER) {
                simulateTap(webView, cursorX, cursorY);
                return true;
            }
            if (code == KeyEvent.KEYCODE_BACK) {
                isPointerMode = false;
                if (cursorOverlay != null) cursorOverlay.setVisibility(View.GONE);
                webView.evaluateJavascript("window.__onTvPointerExit && window.__onTvPointerExit()", null);
                return true;
            }
        }

        if (webView != null && isPlayerActive && !isHudVisible && event.getAction() == KeyEvent.ACTION_DOWN) {
            int code = event.getKeyCode();
            float w = webView.getWidth();
            float h = webView.getHeight();

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
