const CACHE_NAME = 'v2';

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll([
        './',
        './index.html',
        './style.css',
        './main.js',
        './manifest.json'
      ])
    )
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Network-first for GET requests: always try network, fall back to cache
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        return response;
      })
      .catch(() =>
        caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }

          if (event.request.mode === 'navigate') {
            return caches.match('./index.html').then(fallbackResponse => {
              return fallbackResponse || Response.error();
            });
          }

          return Response.error();
        })
      )
  );
});
