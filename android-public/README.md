# MAo — public website Android APK

The `android-public/` project is the public MAo Android app for Android 8+.
It is **not** the MAo Studio app and does not package administrative access.
It opens https://www.mkulimaagricultural.org/ in a dedicated Android WebView.

- Application ID: `org.mkulimaagricultural.website`
- Display name: `MAo`
- Home, About, Focus, Updates, Contact and Donate: public pages handled inside the app
- Other HTTPS URLs, mailto and telephone links: system apps
- Admin subdomain: external browser only, never privileged in-app access
- JavaScript, DOM storage and back button: enabled for the real public website
- No embedded passwords, private keys, CMS APIs or user credentials
- No camera, microphone, contacts or media permissions; INTERNET only
- Internet connection required for current content

## Build and download

GitHub Actions: `.github/workflows/android-public-apk.yml`

On pull requests affecting this project, Actions creates and verifies a signed release APK.
Once merged to `main`, it publishes a public release:
- Tag: `mao-public-android-v1.0.0`
- File: `MAo-Android-v1.0.0.apk`
- Download page: https://www.mkulimaagricultural.org/download/

Build uses Java 17, Gradle 8.10.2, AGP 8.7.3 and SDK 35. The workflow uses
`apksigner verify` and checks the application package ID.

## Long-term Android signing

Set these GitHub Actions secrets for stable upgrade signing:
- `MAO_PUBLIC_ANDROID_KEYSTORE_B64` — base64-encoded private signing JKS
- `MAO_PUBLIC_ANDROID_STORE_PASSWORD`
- `MAO_PUBLIC_ANDROID_KEY_PASSWORD`

Keystore alias: `mao-website`.
Without secrets the workflow creates a one-time self-signed key **per run**.
This first APK is installable, but later builds cannot be installed as in-place
updates without the same private signing key. Users may need to uninstall the
old APK before a replacement can be installed. Never commit private signing
keys in Git.

Future versions must update Gradle `versionCode`, `versionName`, the workflow
filename/tag and `download/index.html` together.

## Installation safety

The APK is not a Google Play Store app. Android may require a confirmation to
install a download from your browser. Only trust the official website and
matching official GitHub Release. Do not disable Play Protect to force installation.

End-to-end load/render, mobile navigation and media tests still require
smoke-testing on a real Android device after the release.
