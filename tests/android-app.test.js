import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('Android app runs only the secure MAo CMS with its Cloudflare Access login', async () => {
  const main = await read('android/app/src/main/java/org/mkulimaagricultural/studio/MainActivity.java');
  const manifest = await read('android/app/src/main/AndroidManifest.xml');
  assert.ok(main.includes('https://admin.mkulimaagricultural.org/admin/'));
  assert.ok(main.includes('.cloudflareaccess.com'));
  assert.ok(main.includes('"https".equalsIgnoreCase'));
  assert.ok(main.includes('new WebView(this)'));
  assert.ok(main.includes('setJavaScriptEnabled(true)'));
  assert.ok(main.includes('setDomStorageEnabled(true)'));
  assert.ok(main.includes('setAllowFileAccess(false)'));
  assert.ok(main.includes('setAllowUniversalAccessFromFileURLs(false)'));
  assert.ok(main.includes('setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW)'));
  assert.ok(main.includes('setAcceptThirdPartyCookies(webView, true)'));
  assert.ok(main.includes('handler.cancel()'));
  assert.ok(main.includes('onShowFileChooser('));
  assert.ok(main.includes('params.createIntent()'));
  assert.ok(main.includes('FileChooserParams.parseResult('));
  assert.ok(main.includes('onBackPressed()'));
  assert.ok(main.includes('new Intent(Intent.ACTION_VIEW, uri)'));
  assert.ok(!main.includes('handler.proceed()'));
  assert.ok(!main.includes('addJavascriptInterface('));
  assert.ok(!main.includes('setWebContentsDebuggingEnabled(true)'));
  assert.ok(!main.includes('CF_Authorization='));
  assert.match(manifest, /uses-permission android:name="android.permission.INTERNET"/);
  assert.match(manifest, /android:allowBackup="false"/);
  assert.match(manifest, /android:usesCleartextTraffic="false"/);
  for (const perm of ['CAMERA', 'RECORD_AUDIO', 'ACCESS_FINE_LOCATION', 'READ_EXTERNAL_STORAGE'])
    assert.ok(!manifest.includes('permission.' + perm));
});

test('Android release is non-debuggable and produces a signed APK with MAo icon', async () => {
  const gradle = await read('android/app/build.gradle');
  const settings = await read('android/settings.gradle');
  const build = await read('android/build.gradle');
  const script = await read('android/scripts/generate_icons.py');
  assert.ok(gradle.includes("applicationId 'org.mkulimaagricultural.studio'"));
  assert.ok(gradle.includes('minSdk 26'));
  assert.ok(gradle.includes('targetSdk 34'));
  assert.ok(gradle.includes("versionName '1.0.0'"));
  assert.ok(gradle.includes('debuggable false'));
  assert.ok(gradle.includes('signingConfig signingConfigs.release'));
  assert.ok(gradle.includes("System.getenv('MAO_ANDROID_KEYSTORE')"));
  assert.ok(gradle.includes("System.getenv('MAO_ANDROID_STORE_PASSWORD')"));
  assert.ok(build.includes("id 'com.android.application' version '8.7.3'"));
  assert.ok(settings.includes("include ':app'"));
  assert.ok(script.includes('mao-logo.png'));
  assert.ok(script.includes('ic_launcher.png'));
  assert.ok(script.includes('ic_launcher_round.png'));
});

test('GitHub Actions builds, validates and publishes an actual Android release APK', async () => {
  const yaml = await read('.github/workflows/android-apk.yml');
  assert.ok(yaml.includes('runs-on: ubuntu-latest'));
  assert.ok(yaml.includes('actions/setup-java@v4'));
  assert.ok(yaml.includes('android-actions/setup-android@v4'));
  assert.ok(yaml.includes('gradle/actions/setup-gradle@v4'));
  assert.ok(yaml.includes(':app:assembleRelease'));
  assert.ok(yaml.includes('apksigner'));
  assert.ok(yaml.includes('MAo-Studio-Android-v1.0.0.apk'));
  assert.ok(yaml.includes('actions/upload-artifact@v4'));
  assert.ok(yaml.includes('softprops/action-gh-release@v2'));
  assert.ok(yaml.includes('tag_name: mao-studio-android-v1.0.0'));
  assert.ok(yaml.includes('SIGNING_KEYSTORE_B64'));
  assert.ok(yaml.includes('contents: write'));
});

test('/app offers both Windows and Android downloads without weakening Cloudflare Access', async () => {
  const html = await read('app/index.html');
  const css = await read('assets/css/app.css');
  const windowsUrl = 'https://github.com/mkulimaagricultural/main/releases/download/mao-studio-v1.0.0/MAo-Studio-Setup-1.0.0.exe';
  const androidUrl = 'https://github.com/mkulimaagricultural/main/releases/download/mao-studio-android-v1.0.0/MAo-Studio-Android-v1.0.0.apk';
  assert.ok(html.includes('id="windows-download"'));
  assert.ok(html.includes(windowsUrl));
  assert.ok(html.includes('id="android-download"'));
  assert.ok(html.includes(androidUrl));
  assert.ok(html.includes('Android 8.0+'));
  assert.ok(html.includes('Cloudflare Access'));
  assert.ok(html.includes('Play Protect'));
  assert.ok(html.includes('/assets/css/app.css?v=android-1'));
  assert.ok(css.includes('.download-stack{display:grid'));
  assert.ok(css.includes('.download-button--android'));
  assert.ok(css.includes('@media(max-width:900px)'));
  assert.ok(html.includes('<link rel="canonical" href="https://www.mkulimaagricultural.org/app/">'));
});
