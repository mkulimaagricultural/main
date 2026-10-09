import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('MAo Windows public app is separate from the protected Studio CMS and enforces navigation security', async () => {
  const main = await read('desktop-public/main.cjs');
  const path = new URL('../desktop-public/main.cjs', import.meta.url).pathname;
  execFileSync(process.execPath, ['--check', path]);
  assert.ok(main.includes("const HOME_URL = 'https://www.mkulimaagricultural.org/'"));
  assert.ok(main.includes("'mkulimaagricultural.org'"));
  assert.ok(main.includes("'www.mkulimaagricultural.org'"));
  assert.ok(main.includes("SESSION_PARTITION = 'persist:mao-public'"));
  assert.ok(main.includes('session.fromPartition(SESSION_PARTITION)'));
  assert.ok(main.includes('nodeIntegration: false'));
  assert.ok(main.includes('contextIsolation: true'));
  assert.ok(main.includes('sandbox: true'));
  assert.ok(main.includes('webSecurity: true'));
  assert.ok(main.includes('setPermissionRequestHandler'));
  assert.ok(main.includes('setPermissionCheckHandler'));
  assert.ok(main.includes('setWindowOpenHandler'));
  assert.ok(main.includes('will-navigate'));
  assert.ok(main.includes('will-redirect'));
  assert.ok(main.includes('shell.openExternal(value)'));
  assert.ok(!main.includes('https://admin.mkulimaagricultural.org/admin/'));
  assert.ok(!main.includes('CF_Authorization='));
  assert.ok(!main.includes('executeJavaScript('));
});

test('MAo public Windows release builds .exe with correct app ID and official MAo logo', async () => {
  const pkg = JSON.parse(await read('desktop-public/package.json'));
  assert.equal(pkg.version, '1.0.0');
  assert.equal(pkg.main, 'main.cjs');
  assert.equal(pkg.build.appId, 'org.mkulimaagricultural.website');
  assert.equal(pkg.build.productName, 'MAo');
  assert.equal(pkg.build.artifactName, 'MAo-Windows-Setup-${version}.${ext}');
  assert.ok(pkg.build.win.target.includes('nsis'));
  assert.equal(pkg.build.win.icon, 'build/icon.ico');
  assert.ok(pkg.devDependencies.electron);
  assert.ok(pkg.devDependencies['electron-builder']);
  const icon = await read('desktop-public/scripts/create_icon.py');
  assert.ok(icon.includes('"mao-logo.png"'));
  assert.ok(icon.includes('"icon.ico"'));
  const workflow = await read('.github/workflows/windows-public.yml');
  assert.ok(workflow.includes('runs-on: windows-latest'));
  assert.ok(workflow.includes('permissions:'));
  assert.ok(workflow.includes('contents: write'));
  assert.ok(workflow.includes('branches: [main]'));
  assert.ok(workflow.includes('node --check desktop-public/main.cjs'));
  assert.ok(workflow.includes('npm run dist:win'));
  assert.ok(workflow.includes('actions/upload-artifact@v4'));
  assert.ok(workflow.includes('softprops/action-gh-release@v2'));
  assert.ok(workflow.includes('tag_name: mao-public-windows-v1.0.0'));
  assert.ok(workflow.includes('MAo-Windows-Setup-1.0.0.exe'));
  assert.ok(workflow.includes("github.event_name == 'push'"));
});

test('/download presents Windows and Android for public users while /app remains staff-only', async () => {
  const html = await read('download/index.html');
  const css = await read('assets/css/download.css');
  const studio = await read('app/index.html');
  const builder = await read('scripts/build.mjs');
  assert.ok(html.includes('id="android-download"'));
  assert.ok(html.includes('id="windows-download"'));
  assert.ok(html.includes('https://github.com/mkulimaagricultural/main/releases/download/mao-public-android-v1.0.0/MAo-Android-v1.0.0.apk'));
  assert.ok(html.includes('https://github.com/mkulimaagricultural/main/releases/download/mao-public-windows-v1.0.0/MAo-Windows-Setup-1.0.0.exe'));
  assert.ok(html.includes('Windows 10/11'));
  assert.ok(html.includes('No CMS account needed'));
  assert.ok(html.includes('Unknown publisher'));
  assert.ok(html.includes('Play Protect'));
  assert.ok(html.includes('href="/app/"'));
  assert.ok(css.includes('.download-stack{'));
  assert.ok(css.includes('.download-button--windows{'));
  assert.ok(builder.includes("'app', 'download'"));
  assert.ok(studio.includes('https://admin.mkulimaagricultural.org/admin/'));
  assert.ok(studio.includes('MAo Studio'));
});
