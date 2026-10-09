# MAo Studio for Android

This native Java Android app opens the existing Cloudflare Access-protected MAo Studio in a dedicated secure WebView.

- **Android:** 8.0 or newer (API 26+), phone or tablet.
- **Backend:** https://admin.mkulimaagricultural.org/admin/
- **Access:** Only approved MAo staff with a working Cloudflare Access login.
- **Offline:** Not supported; internet is required.
- **Media uploads:** Android's native file picker is used for photos/videos, including multiple selection if offered by the page.
- **Privacy:** No login credentials, API keys, CMS database, post content or auth cookies are packaged in the APK.
- **Permissions:** INTERNET only. No camera, microphone, location, contacts or storage permission is requested.
- **Link handling:** The CMS and Cloudflare Access login pages remain in the app's WebView. Other HTTPS destinations open via the system browser. Invalid certificates are refused.
- **Available on GitHub:** `MAo-Studio-Android-v1.0.0.apk` from the `mao-studio-android-v1.0.0` release. Website download directory: https://www.mkulimaagricultural.org/app/.

## Building

Android builds run in `.github/workflows/android-apk.yml` on GitHub Actions using Java 17, Gradle 8.10.2, Android Gradle Plugin 8.7.3 and Android SDK 35.

The workflow:
1. Generates the launcher icons from the official `assets/img/mao-logo.png`.
2. Creates a signing keystore outside the repository.
3. Builds `assembleRelease` (not debuggable).
4. Validates Android APK signatures and package ID.
5. Uploads the APK as an Actions artifact. On `main`, publishes an official GitHub Release.

**Long-term update signing is essential:** Set the three repository Actions secrets before releasing subsequent Android versions: `MAO_ANDROID_SIGNING_KEYSTORE_B64`, `MAO_ANDROID_STORE_PASSWORD`, and `MAO_ANDROID_KEY_PASSWORD`. The signing key alias is `mao-studio`. Without these secrets, CI generates a fresh temporary signing certificate for the current APK. APKs signed with different certificates cannot install as seamless upgrades and require uninstalling the previous build, which will erase local WebView sessions. Do not commit private keys to GitHub.

## Installation

Download directly from the official MAo site or its verified GitHub release. Android may ask permission to install an APK obtained from your browser or file manager. Follow Android's normal security prompts **only after verifying the file source** and do not disable Google Play Protect to force installation.

Cloudflare Access's OTP login must be verified on an actual Android device after release; automated builds cannot confirm your authorization session or file upload end-to-end.

## Updating

Increment `versionCode` and `versionName` in `app/build.gradle` and adjust the workflow release tag, APK filename and the direct Android download link in `app/index.html`. Always use the same private keystore for an in-place update.
