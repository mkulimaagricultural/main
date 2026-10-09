package org.mkulimaagricultural.studio;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.PermissionRequest;
import android.webkit.SslErrorHandler;
import android.net.http.SslError;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

/**
 * Dedicated Android shell for the existing Cloudflare Access-protected MAo Studio.
 * No passwords, API keys, cookies or private CMS data are embedded in the APK.
 */
public final class MainActivity extends Activity {
    private static final String STUDIO_URL = "https://admin.mkulimaagricultural.org/admin/";
    private static final int PICK_FILES = 4201;

    private WebView webView;
    private ValueCallback<Uri[]> fileChooser;

    private static boolean isTrusted(String value) {
        try {
            Uri url = Uri.parse(value);
            String host = url.getHost();
            return "https".equalsIgnoreCase(url.getScheme()) && host != null &&
                    ("admin.mkulimaagricultural.org".equalsIgnoreCase(host) ||
                     host.toLowerCase(java.util.Locale.ROOT).endsWith(".cloudflareaccess.com"));
        } catch (Exception ignored) {
            return false;
        }
    }

    private void openExternal(String value) {
        try {
            Uri uri = Uri.parse(value);
            if (!"https".equalsIgnoreCase(uri.getScheme())) return;
            startActivity(new Intent(Intent.ACTION_VIEW, uri)
                    .addCategory(Intent.CATEGORY_BROWSABLE));
        } catch (ActivityNotFoundException ignored) {
            Toast.makeText(this, "No browser available to open this link.", Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);

        webView = new WebView(this);
        webView.setBackgroundColor(android.graphics.Color.rgb(247, 246, 241));
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true); // Needed for user-selected photo/video URIs.
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setSupportMultipleWindows(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);

        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);
        // Cloudflare Access login and redirect flow may require cross-site cookies.
        cookies.setAcceptThirdPartyCookies(webView, true);

        webView.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (!request.isForMainFrame()) return false;
                String url = request.getUrl().toString();
                if (isTrusted(url)) return false;
                openExternal(url);
                return true;
            }

            @Override public void onReceivedSslError(WebView view,
                                                       SslErrorHandler handler, SslError error) {
                handler.cancel(); // Never bypass invalid HTTPS certificates.
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(
                    WebView view,
                    ValueCallback<Uri[]> callback,
                    FileChooserParams params) {
                if (fileChooser != null) fileChooser.onReceiveValue(null);
                fileChooser = callback;
                try {
                    Intent chooser = params.createIntent();
                    chooser.addCategory(Intent.CATEGORY_OPENABLE);
                    startActivityForResult(chooser, PICK_FILES);
                    return true;
                } catch (ActivityNotFoundException e) {
                    fileChooser = null;
                    callback.onReceiveValue(null);
                    Toast.makeText(MainActivity.this,
                            "No file picker available on this device.", Toast.LENGTH_SHORT).show();
                    return true;
                } catch (Exception e) {
                    fileChooser = null;
                    callback.onReceiveValue(null);
                    return true;
                }
            }

            @Override public void onPermissionRequest(PermissionRequest request) {
                request.deny(); // File chooser does not need camera or microphone permission.
            }
        });

        webView.setDownloadListener((url, agent, disposition, mime, length) -> openExternal(url));

        if (state == null || webView.restoreState(state) == null) {
            webView.loadUrl(STUDIO_URL);
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != PICK_FILES || fileChooser == null) return;
        Uri[] chosen = WebChromeClient.FileChooserParams.parseResult(resultCode, data);
        fileChooser.onReceiveValue(chosen);
        fileChooser = null;
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        if (webView != null) webView.saveState(outState);
        super.onSaveInstanceState(outState);
    }

    @Override
    protected void onDestroy() {
        if (fileChooser != null) {
            fileChooser.onReceiveValue(null);
            fileChooser = null;
        }
        if (webView != null) {
            webView.stopLoading();
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
