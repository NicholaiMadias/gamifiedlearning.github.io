(() => {
  if (!('serviceWorker' in navigator) || window.location.protocol === 'file:') {
    return;
  }

  const scriptSrc = document.currentScript?.src || window.location.href;
  const serviceWorkerUrl = new URL('./sw.js', scriptSrc);

  window.addEventListener('load', () => {
    navigator.serviceWorker.register(serviceWorkerUrl.href).catch(error => {
      console.warn('[sw] registration failed:', error);
    });
  });
})();
