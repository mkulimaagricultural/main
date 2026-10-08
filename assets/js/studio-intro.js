/* First-entry-only MAo Studio intro. Runs in <head>, independent of CMS data loading. */
(() => {
  'use strict';

  const root = document.documentElement;
  const key = 'mao-studio-logo-intro-shown';
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

  try {
    if (window.sessionStorage.getItem(key) === '1') return;
    window.sessionStorage.setItem(key, '1');
  } catch (_) {
    // Storage can be disabled; a single page load still works normally.
  }

  root.classList.add('mao-studio-intro-active');

  let finished = false;
  function finish() {
    if (finished) return;
    finished = true;
    root.classList.remove('mao-studio-intro-active');
    document.getElementById('mao-studio-intro')?.remove();
  }

  document.addEventListener('animationend', (event) => {
    if (event.target?.id === 'mao-studio-intro') finish();
  });

  // Never block CMS controls if animation cannot run or the page loads slowly.
  window.setTimeout(finish, 1600);
})();
