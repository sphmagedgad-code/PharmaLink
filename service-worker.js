// service-worker.js
// PharmaLink OS — Offline-First Service Worker (V1)
// Cache-first strategy for app shell. IndexedDB data is NOT cached here
// (handled entirely by the app's own DB layer, independent of this worker).

const CACHE_NAME = 'pharmalink-shell-v1';

const APP_SHELL = [
  './index.html',
  './offline.html',
  './manifest.json',
  './src/ui/dashboard.html',
  './src/ui/medicines.html',
  './src/ui/suppliers.html',
  './src/ui/deals.html',
  './src/ui/whatsapp.html',
  './src/ui/search.html',
  './src/ui/settings.html',
  './src/ui/styles.css',
  './src/ui/nav.js',
  './src/ui/dashboard.js',
  './src/ui/medicines.js',
  './src/ui/suppliers.js',
  './src/ui/deals.js',
  './src/ui/whatsapp.js',
  './src/ui/search.js',
  './src/ui/settings.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(() => caches.match('./offline.html'));
    })
  );
});
