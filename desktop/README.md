# MAo Studio — Windows desktop

The `desktop/` directory contains the Windows installer source for **MAo Studio**.
It is a minimal, sandboxed Electron window that loads the existing online CMS:
https://admin.mkulimaagricultural.org/admin/

## Download
The public MAo website hosts the download page at https://www.mkulimaagricultural.org/app/
and the 64-bit NSIS installer is published through the official GitHub Releases channel:
https://github.com/mkulimaagricultural/main/releases/latest

Installer file: `MAo-Studio-Setup-1.0.0.exe` (version 1.0.0).

## Security and functionality
- Windows 10/11 x64; internet required; users must be authorized by Cloudflare Access.
- Browser session cookies are isolated in a persistent Electron partition, not embedded in the installer.
- Remote pages never get Node.js access; `contextIsolation: true`, `sandbox: true` and `webSecurity: true`.
- Cloudflare Access login pages are allowed inside the secure window; unrelated HTTPS destinations open in the default external browser.
- Existing CMS APIs, image/video uploads and publishing run against the same backend as the web app.
- No database, Supabase, D1, R2 or Cloudflare Access secrets are packaged with the program.
- No local/offline database. MAo's server continues to enforce every authorization.
- Electron app package version is pinned to 1.0.0 until the next planned release.

## Release process
The repository's `.github/workflows/windows-desktop.yml` builds and tests the installer
on pull requests touching `desktop/`. After merge to `main`, it builds on Windows
and publishes the installer as a public GitHub release `mao-studio-v1.0.0`.
If a runner is unavailable, or release publishing fails, check the GitHub Actions
logs. Do not advertise an unverified direct download.

To make a new version, bump `desktop/package.json` and the workflow's release tag,
installer filename and matching link on `app/index.html` together. Add a release
notes entry and verify the public download.

## Local Windows development
```powershell
cd desktop
npm install
npm start
```

To package locally, run `python -m pip install Pillow`,
then `python scripts/create_icon.py` from the repository root
and `npm run dist:win` from `desktop/`.

## Windows SmartScreen
The free initial installer is not digitally code-signed. Windows may warn
about an unknown publisher. Users must verify the official download source.
A trusted Windows code-signing certificate is recommended before wide distribution.
