'use strict';

// MAo for Windows: a hardened public-site shell, NOT the staff-only MAo Studio.
// No privileged bridge, Node APIs, embedded credentials, or CMS access are exposed.
const { app, BrowserWindow, Menu, dialog, shell, session } = require('electron');

const HOME_URL = 'https://www.mkulimaagricultural.org/';
const PUBLIC_HOSTS = new Set(['www.mkulimaagricultural.org', 'mkulimaagricultural.org']);
const SESSION_PARTITION = 'persist:mao-public';

function trustedPublicUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.port && PUBLIC_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

function externalHttpsUrl(value) {
  try { return new URL(value).protocol === 'https:'; }
  catch { return false; }
}

function openExternal(value) {
  if (externalHttpsUrl(value)) shell.openExternal(value).catch(() => {});
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const window = BrowserWindow.getAllWindows()[0];
    if (!window) return;
    if (window.isMinimized()) window.restore();
    window.focus();
  });

  app.whenReady().then(() => {
    app.setAppUserModelId('org.mkulimaagricultural.website');
    Menu.setApplicationMenu(null);

    const publicSession = session.fromPartition(SESSION_PARTITION);
    publicSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
    publicSession.setPermissionCheckHandler(() => false);

    const window = new BrowserWindow({
      title: 'MAo — Mkulima Agricultural Organization',
      width: 1240,
      height: 820,
      minWidth: 760,
      minHeight: 530,
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

    window.once('ready-to-show', () => window.show());
    const visibilityFallback = setTimeout(() => {
      if (!window.isDestroyed()) window.show();
    }, 8000);
    window.on('closed', () => clearTimeout(visibilityFallback));

    window.webContents.on('will-attach-webview', (event) => event.preventDefault());

    window.webContents.setWindowOpenHandler(({ url }) => {
      if (trustedPublicUrl(url)) {
        window.loadURL(url).catch(() => {});
      } else {
        openExternal(url);
      }
      return { action: 'deny' };
    });

    window.webContents.on('will-navigate', (event, url) => {
      if (trustedPublicUrl(url)) return;
      event.preventDefault();
      openExternal(url);
    });

    window.webContents.on('will-redirect', (event, url) => {
      if (trustedPublicUrl(url)) return;
      event.preventDefault();
      openExternal(url);
    });

    window.webContents.on('did-fail-load', async (_event, errorCode, _description, _validatedURL, isMainFrame) => {
      if (!isMainFrame || errorCode === -3 || window.isDestroyed()) return;
      const { response } = await dialog.showMessageBox(window, {
        type: 'warning',
        title: 'MAo — Connection',
        message: 'MAo could not connect to the website.',
        detail: 'Check your internet connection and try again. The latest content requires internet.',
        buttons: ['Retry', 'Close'],
        defaultId: 0,
        cancelId: 1,
        noLink: true
      });
      if (window.isDestroyed()) return;
      if (response === 0) window.loadURL(HOME_URL).catch(() => {});
      else window.close();
    });

    window.loadURL(HOME_URL).catch(() => {});
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
