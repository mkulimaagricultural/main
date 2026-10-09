import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

const text = (path) => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('Windows client is a secure stand-alone wrapper around the real MAo CMS', async () => {
  const source = await text('desktop/main.cjs');
  execFileSync(process.execPath, ['--check', new URL('../desktop/main.cjs', import.meta.url).pathname]);
  assert.ok(source.includes('https://admin.mkulimaagricultural.org/admin/'));
  assert.ok(source.includes("partition: SESSION_PARTITION"));
  assert.ok(source.includes("partition('persist:mao-studio')") || source.includes("session.fromPartition(SESSION_PARTITION)"));
  assert.match(source, /nodeIntegration:\s*false/);
  assert.match(source, /contextIsolation:\s*true/);
  assert.match(source, /sandbox:\s*true/);
  assert.match(source, /webSecurity:\s*true/);
  assert.ok(source.includes("url.protocol === 'https:'"));
  assert.ok(source.includes("url.hostname.endsWith('.cloudflareaccess.com')"));
  assert.ok(source.includes('setPermissionRequestHandler'));
  assert.ok(source.includes('setWindowOpenHandler'));
  assert.ok(source.includes("shell.openExternal(url)"));
  assert.ok(!source.includes('nodeIntegration: true'));
  assert.ok(!source.includes('webSecurity: false'));
  assert.ok(!source.includes('executeJavaScript('));
  assert.ok(!source.includes('CF_Authorization='));
});

test('Windows NSIS installer is configured with proper logo and stable download name', async () => {
  const packageJson = JSON.parse(await text('desktop/package.json'));
  assert.equal(packageJson.version, '1.0.0');
  assert.equal(packageJson.main, 'main.cjs');
  assert.equal(packageJson.build.appId, 'org.mkulimaagricultural.studio');
  assert.equal(packageJson.build.productName, 'MAo Studio');
  assert.equal(packageJson.build.artifactName, 'MAo-Studio-Setup-${version}.${ext}');
  assert.ok(packageJson.build.win.target.includes('nsis'));
  assert.equal(packageJson.build.win.icon, 'build/icon.ico');
  assert.equal(packageJson.build.nsis.oneClick, false);
  assert.ok(packageJson.devDependencies.electron);
  assert.ok(packageJson.devDependencies['electron-builder']);
  const iconScript = await text('desktop/scripts/create_icon.py');
  assert.ok(iconScript.includes('"mao-logo.png"'));
  assert.ok(iconScript.includes('"icon.ico"'));
});

test('GitHub Windows Actions builds installer on PR and publishes a public release from main', async () => {
  const yaml = await text('.github/workflows/windows-desktop.yml');
  assert.ok(yaml.includes('runs-on: windows-latest'));
  assert.ok(yaml.includes('contents: write'));
  assert.ok(yaml.includes('pull_request:'));
  assert.ok(yaml.includes('branches: [main]'));
  assert.ok(yaml.includes('npm run dist:win'));
  assert.ok(yaml.includes('MAo-Studio-Setup-1.0.0.exe'));
  assert.ok(yaml.includes('actions/upload-artifact@v4'));
  assert.ok(yaml.includes('softprops/action-gh-release@v2'));
  assert.ok(yaml.includes('tag_name: mao-studio-v1.0.0'));
  assert.ok(yaml.includes("github.event_name == 'push'"));
});

test('/app has accessible Windows download linked to versioned installer and keeps admin protected', async () => {
  const page = await text('app/index.html');
  const stylesheet = await text('assets/css/app.css');
  const builder = await text('scripts/build.mjs');
  const xml = await text('sitemap.xml');
  assert.ok(page.includes('<title>Download MAo Studio for Windows | MAo</title>'));
  assert.ok(page.includes('<link rel="canonical" href="https://www.mkulimaagricultural.org/app/">'));
  assert.ok(page.includes('id="windows-download"'));
  assert.ok(page.includes('https://github.com/mkulimaagricultural/main/releases/latest/download/MAo-Studio-Setup-1.0.0.exe'));
  assert.ok(page.includes('https://admin.mkulimaagricultural.org/admin/'));
  assert.ok(page.includes('Cloudflare Access'));
  assert.ok(page.includes('Unknown publisher'));
  assert.ok(stylesheet.includes('.app-hero__inner{'));
  assert.ok(stylesheet.includes('@media(max-width:590px)'));
  assert.ok(builder.includes("'donate', 'app'"));
  assert.ok(xml.includes('https://www.mkulimaagricultural.org/app/'));
  assert.ok(!page.includes('CF_Authorization'));
});
