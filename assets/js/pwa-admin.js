/* MAo Studio install UI. Do not cache CMS data, and never bypass Cloudflare Access. */
(() => {
  'use strict';

  if (location.hostname !== 'admin.mkulimaagricultural.org' && location.hostname !== 'localhost') return;

  const button = document.getElementById('install-studio');
  const help = document.getElementById('studio-install-help');
  const message = document.getElementById('studio-install-message');
  const close = document.getElementById('studio-install-help-close');
  if (!button || !help || !message || !close) return;

  let pendingPrompt = null;
  const standalone = () => (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    window.navigator.standalone === true
  );

  function closeHelp() {
    help.hidden = true;
    button.setAttribute('aria-expanded', 'false');
  }

  function hideInstall() {
    pendingPrompt = null;
    closeHelp();
    button.hidden = true;
  }

  function instructions() {
    const ua = navigator.userAgent || '';
    if (/iPad|iPhone|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
      return 'On iPhone or iPad, use Share → Add to Home Screen. If you do not see that option, open MAo Studio in Safari and try again.';
    }
    if (/Android/i.test(ua)) {
      return 'On Android, open your browser menu (⋮) and choose Install app or Add to Home screen. If the option is missing, refresh MAo Studio after signing in.';
    }
    if (/Firefox/i.test(ua)) {
      return 'Firefox desktop does not offer this install prompt. Open MAo Studio in Chrome or Microsoft Edge, then use the browser menu → Install app.';
    }
    if (/Macintosh|Mac OS X/i.test(ua) && /Safari/i.test(ua) && !/Chrome|Chromium|Edg/i.test(ua)) {
      return 'In Safari on Mac, use File → Add to Dock to install MAo Studio.';
    }
    return 'In Chrome or Microsoft Edge, use the browser menu (⋮) → Install MAo Studio (or Apps → Install this site as an app). If it is missing, refresh after signing in to Cloudflare Access.';
  }

  if (standalone()) hideInstall();

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    pendingPrompt = event;
    if (!standalone()) button.hidden = false;
  });

  window.addEventListener('appinstalled', hideInstall);
  window.matchMedia?.('(display-mode: standalone)').addEventListener?.('change', () => {
    if (standalone()) hideInstall();
  });

  button.addEventListener('click', () => {
    if (standalone()) { hideInstall(); return; }

    if (pendingPrompt) {
      const prompt = pendingPrompt;
      pendingPrompt = null;
      closeHelp();
      // Must be called synchronously from the user's click gesture.
      try {
        const shown = prompt.prompt();
        Promise.resolve(shown).then(() => prompt.userChoice).then((choice) => {
          if (choice?.outcome === 'accepted') {
            message.textContent = 'Follow the browser instructions to finish installing MAo Studio.';
            help.hidden = false;
            button.setAttribute('aria-expanded', 'true');
          }
        }).catch(() => {
          message.textContent = instructions();
          help.hidden = false;
          button.setAttribute('aria-expanded', 'true');
        });
      } catch (_) {
        message.textContent = instructions();
        help.hidden = false;
        button.setAttribute('aria-expanded', 'true');
      }
      return;
    }

    const opening = help.hidden;
    if (opening) message.textContent = instructions();
    help.hidden = !opening;
    button.setAttribute('aria-expanded', String(opening));
  });

  close.addEventListener('click', closeHelp);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !help.hidden) closeHelp();
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/admin/sw.js', {
        scope: '/admin/',
        updateViaCache: 'none'
      }).catch(() => {
        // Access sign-in can expire. Fail open for the regular online CMS.
        // Keep the install button so the user can follow browser instructions.
      });
    });
  }
})();
