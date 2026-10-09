if ('serviceWorker' in navigator && location.hostname === 'admin.mkulimaagricultural.org') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/admin/sw.js', { scope: '/admin/', updateViaCache: 'none' }).catch(() => {
      // Authentication and publishing continue to work without a service worker.
    });
  });
}
