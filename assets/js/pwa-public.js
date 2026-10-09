if ('serviceWorker' in navigator && location.hostname !== 'admin.mkulimaagricultural.org') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).catch(() => {
      // The public site remains usable if service workers are unavailable.
    });
  });
}
