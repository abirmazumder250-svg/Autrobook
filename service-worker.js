// ==========================================
// Version Update Rule: Increase version number on every update (v5 -> v6 -> v7)
// ==========================================
const CACHE_NAME = 'autrobook-v5';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './splash.html',
  './reels.html',
  './create-reels.html',
  './profile.html',
  './css/index.css',
  './js/index.js',
  './logo.png'
];

// ==========================================
// 1. INSTALL: Cache static files
// ==========================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

// ==========================================
// 2. ACTIVATE: Delete all old caches
// ==========================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// ==========================================
// 3. FETCH: Always try fresh network first
// ==========================================
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() =>
        caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        })
      )
  );
});
