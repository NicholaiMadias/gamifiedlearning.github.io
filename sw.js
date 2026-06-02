const CACHE_NAME = 'amazing-grace-v9';

// Core pages and game modules deployed at stable paths.
// Use scope-relative URLs (./…) so the service worker works correctly
// whether the site is deployed at the root or a subpath (e.g. GitHub Pages).
// Avoid caching /arcade directly because it issues a 301 redirect on
// static hosts — cache the concrete file instead.
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './arcade/index.html',
    './arcade/star-matrix/index.html',
    './arcade/matrix-of-conscience/index.html',
    './arcade/trinity/index.html',
    './arcade/bible-study/index.html',
    './arcade/certificates/index.html',
    './ministry/index.html',
    './manifest.json',
    './star-map.js',
    './badges.js',
    './levelSystem.js',
    './daily.js',
];

const STATIC_DESTINATIONS = new Set(['style', 'script', 'image', 'font', 'manifest']);
const STATIC_ASSET_PATTERN = /\.(?:css|js|mjs|cjs|json|png|jpg|jpeg|svg|gif|webp|avif|ico|woff2?|ttf|otf)$/i;
const OFFLINE_PAGE_FALLBACKS = new Map([
    ['/', './index.html'],
    ['/index.html', './index.html'],
    ['/arcade/', './arcade/index.html'],
    ['/arcade/index.html', './arcade/index.html'],
    ['/arcade/star-matrix/', './arcade/star-matrix/index.html'],
    ['/arcade/star-matrix/index.html', './arcade/star-matrix/index.html'],
    ['/arcade/matrix-of-conscience/', './arcade/matrix-of-conscience/index.html'],
    ['/arcade/matrix-of-conscience/index.html', './arcade/matrix-of-conscience/index.html'],
    ['/arcade/certificates/', './arcade/certificates/index.html'],
    ['/arcade/certificates/index.html', './arcade/certificates/index.html'],
    ['/arcade/trinity/', './arcade/trinity/index.html'],
    ['/arcade/trinity/index.html', './arcade/trinity/index.html'],
    ['/arcade/bible-study/', './arcade/bible-study/index.html'],
    ['/arcade/bible-study/index.html', './arcade/bible-study/index.html'],
    ['/ministry/', './ministry/index.html'],
    ['/ministry/index.html', './ministry/index.html']
]);
const SCOPE_PATH = new URL(self.registration.scope).pathname.replace(/\/$/, '');

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Arcade Cache Opened');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    const { request } = event;

    // Only cache same-origin GET requests
    if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) {
        return;
    }

    // Avoid a Chrome DevTools prefetch quirk that can throw on this request mode.
    if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') {
        return;
    }

    if (isNavigationRequest(request)) {
        event.respondWith(handleNavigationRequest(request));
        return;
    }

    if (isStaticAssetRequest(request)) {
        event.respondWith(handleStaticAssetRequest(request, event));
    }
});

function isNavigationRequest(request) {
    return request.mode === 'navigate' || request.destination === 'document';
}

function isStaticAssetRequest(request) {
    const pathname = new URL(request.url).pathname;
    return STATIC_DESTINATIONS.has(request.destination) || STATIC_ASSET_PATTERN.test(pathname);
}

function shouldCacheResponse(response) {
    return response && response.ok && response.type === 'basic';
}

function toScopeRelativePath(url) {
    const pathname = new URL(url).pathname;

    if (!SCOPE_PATH || SCOPE_PATH === '/') {
        return pathname;
    }

    return pathname.startsWith(SCOPE_PATH)
        ? pathname.slice(SCOPE_PATH.length) || '/'
        : pathname;
}

async function handleNavigationRequest(request) {
    try {
        return await fetch(request);
    } catch {
        const cache = await caches.open(CACHE_NAME);
        const fallbackUrl = OFFLINE_PAGE_FALLBACKS.get(toScopeRelativePath(request.url));

        return (await cache.match(request))
            || (fallbackUrl ? await cache.match(fallbackUrl) : undefined)
            || Response.error();
    }
}

async function handleStaticAssetRequest(request, event) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    const networkResponsePromise = fetch(request)
        .then(async response => {
            if (shouldCacheResponse(response)) {
                await cache.put(request, response.clone());
            }
            return response;
        })
        .catch(() => undefined);

    if (cachedResponse) {
        // Serve the cached asset immediately and refresh it in the background.
        event.waitUntil(networkResponsePromise);
        return cachedResponse;
    }

    return networkResponsePromise.then(response => response || Response.error());
}
