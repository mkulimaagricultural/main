/* One-time logo intro on each public page. Run in <head> to avoid a content flash. */
(() => {
  'use strict';

  const root = document.documentElement;
  const currentPath = window.location?.pathname?.replace(/\/+$/, '') || '/';
  const key = currentPath === '/' ? 'mao-home-logo-intro-shown' : 'mao-home-logo-intro-shown:' + currentPath;
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) return;

  try {
    if (window.sessionStorage.getItem(key) === '1') return;
    window.sessionStorage.setItem(key, '1');
  } catch (_) {
    // Storage may be disabled in private browsing; still allow the intro.
  }

  root.classList.add('mao-home-intro-active');

  let finished = false;
  function finish() {
    if (finished) return;
    finished = true;
    root.classList.remove('mao-home-intro-active');
    document.getElementById('mao-home-intro')?.remove();
  }

  // Listen from <head> so this works even if deferred scripts/data load slowly.
  document.addEventListener('animationend', (event) => {
    if (event.target?.id === 'mao-home-intro') finish();
  });

  // Fail-safe: never keep public content blocked if CSS animation fails to run.
  window.setTimeout(finish, 1600);
})();
