// Story Weaver — minimal offline cache service worker.
// Cache-first for app shell, network-fallback for everything else.

const CACHE = 'storyweaver-v1';
const ASSETS = [
  './',
  './index.html',
  './data.js',
  './cover.jsx',
  './screens.jsx',
  './app.jsx',
  './manifest.webmanifest',
  './icon.svg',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        // opportunistically cache CDN scripts + fonts so we're truly offline-capable
        if (res && res.ok && (req.url.startsWith('https://unpkg.com/') || req.url.startsWith('https://fonts.'))) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
