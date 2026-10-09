package org.mkulimaagricultural.website;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.net.http.SslError;
import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.SslErrorHandler;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.webkit.PermissionRequest;
import android.widget.Toast;
import java.util.Locale;

/**
 * Public MAo Website app. Not an admin client; privileged CMS URLs always
 * open outside this app in the system browser.
 */
public final class MainActivity extends Activity {
    private static final String HOME_URL = "https://www.mkulimaagricultural.org/";
    private WebView webView;

    private static boolean isPublicMAoPage(Uri uri) {
        String host = uri.getHost();
        return "https".equalsIgnoreCase(uri.getScheme()) && host != null &&
                ("www.mkulimaagricultural.org".equalsIgnoreCase(host) ||
                 "mkulimaagricultural.org".equalsIgnoreCase(host));
    }

    private void openOutside(Uri uri) {
        String scheme = uri.getScheme();
        if (scheme == null) return;
        scheme = scheme.toLowerCase(Locale.ROOT);
        if (!"https".equals(scheme) && !"mailto".equals(scheme) && !"tel".equals(scheme)) return;
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, uri);
            intent.addCategory(Intent.CATEGORY_BROWSABLE);
            startActivity(intent);
        } catch (ActivityNotFoundException e) {
            Toast.makeText(this, "No app available for this link.", Toast.LENGTH_SHORT).show();
        } catch (SecurityException ignored) {
            Toast.makeText(this, "This link cannot be opened.", Toast.LENGTH_SHORT).show();
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
        settings.setAllowContentAccess(false);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setSupportMultipleWindows(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setSafeBrowsingEnabled(true);

        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, false);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (!request.isForMainFrame()) return false;
                Uri destination = request.getUrl();
                if (isPublicMAoPage(destination)) return false;
                openOutside(destination);
                return true;
            }

            @Override
            public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
                handler.cancel(); // Never bypass invalid TLS certificates.
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override public void onPermissionRequest(PermissionRequest request) {
                request.deny(); // Public website does not need camera/microphone.
            }
        });

        // PDFs and external files can be downloaded by the user's browser.
        webView.setDownloadListener((url, userAgent, disposition, mimeType, length) -> {
            try { openOutside(Uri.parse(url)); }
            catch (Exception ignored) { }
        });

        if (state == null || webView.restoreState(state) == null) {
            webView.loadUrl(HOME_URL);
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        if (webView != null) webView.saveState(outState);
        super.onSaveInstanceState(outState);
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.stopLoading();
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
