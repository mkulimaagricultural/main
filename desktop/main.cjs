'use strict';

// MAo Studio Windows: only remote HTTPS pages run inside a hardened Electron shell.
// All Cloudflare Access authentication takes place on the actual protected site.
const { app, BrowserWindow, shell, session, Menu, dialog } = require('electron');

const STUDIO_URL = 'https://admin.mkulimaagricultural.org/admin/';
const ADMIN_HOST = 'admin.mkulimaagricultural.org';
const SESSION_PARTITION = 'persist:mao-studio';

function isTrustedUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' &&
      (url.hostname === ADMIN_HOST || url.hostname.endsWith('.cloudflareaccess.com'));
  } catch {
    return false;
  }
}

function isExternalHttps(value) {
  try { return new URL(value).protocol === 'https:'; }
  catch { return false; }
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.focus();
  });

  app.whenReady().then(() => {
    app.setAppUserModelId('org.mkulimaagricultural.studio');
    Menu.setApplicationMenu(null);

    const accountSession = session.fromPartition(SESSION_PARTITION);
    accountSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));

    const win = new BrowserWindow({
      title: 'MAo Studio',
      width: 1280,
      height: 830,
      minWidth: 850,
      minHeight: 600,
      show: false,
      backgroundColor: '#f7f6f1',
      autoHideMenuBar: true,
      webPreferences: {
        partition: SESSION_PARTITION,
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        webSecurity: true,
        devTools: false,
        allowRunningInsecureContent: false
      }
    });

    win.once('ready-to-show', () => win.show());
    // The user should still be able to see the window on a slow network.
    const showFallback = setTimeout(() => {
      if (!win.isDestroyed()) win.show();
    }, 8000);
    win.on('closed', () => clearTimeout(showFallback));

    win.webContents.setWindowOpenHandler(({ url }) => {
      // Preserve Access login in the same cookie partition. Everything else
      // opens in the user's regular browser, never with Node or app privileges.
      if (isTrustedUrl(url)) {
        win.loadURL(url).catch(() => {});
      } else if (isExternalHttps(url)) {
        shell.openExternal(url).catch(() => {});
      }
      return { action: 'deny' };
    });

    win.webContents.on('will-navigate', (event, url) => {
      if (isTrustedUrl(url)) return;
      event.preventDefault();
      if (isExternalHttps(url)) shell.openExternal(url).catch(() => {});
    });

    win.webContents.on('did-fail-load', async (_event, code, description, validatedURL, isMainFrame) => {
      if (!isMainFrame || code === -3 || win.isDestroyed()) return;
      const { response } = await dialog.showMessageBox(win, {
        type: 'warning',
        title: 'MAo Studio — Connection',
        message: 'MAo Studio could not load the secure CMS.',
        detail: 'Please check your internet connection and Cloudflare Access sign-in, then try again.',
        buttons: ['Retry', 'Close'],
        defaultId: 0,
        cancelId: 1,
        noLink: true
      });
      if (response === 0 && !win.isDestroyed()) win.loadURL(STUDIO_URL).catch(() => {});
      else if (!win.isDestroyed()) win.close();
    });

    win.loadURL(STUDIO_URL).catch(() => {});
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
