// Story Weaver — service worker.
// Strategy: network-first for app files (so updates propagate immediately),
// cache-first for CDN resources (pinned versions that never change).

const CACHE = 'storyweaver-v3';
const CDN_ORIGINS = ['https://unpkg.com/', 'https://fonts.gstatic.com', 'https://fonts.googleapis.com'];

self.addEventListener('install', (e) => {
  e.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const isCdn = CDN_ORIGINS.some((o) => req.url.startsWith(o));

  if (isCdn) {
    // CDN: cache-first — these are pinned versions, safe to serve forever
    e.respondWith(
      caches.match(req).then((hit) => {
        if (hit) return hit;
        return fetch(req).then((res) => {
          if (res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone()));
          return res;
        });
      })
    );
  } else {
    // App files: network-first — always get the latest, cache as offline fallback
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone()));
          return res;
        })
        .catch(() => caches.match(req))
    );
  }
});
