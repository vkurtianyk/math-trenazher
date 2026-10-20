'use strict';

// Спершу віддаємо з кешу (працює офлайн), а у фоні оновлюємо кеш із мережі.
const CACHE = 'math-trenazher';
const FILES = [
  './', 'index.html', 'style.css', 'app.js', 'icon.svg',
  'games/count.js', 'games/hidden.js', 'games/shapes.js', 'games/compare.js',
  'games/give.js', 'games/find.js', 'games/corners.js',
  'games/feed.js', 'games/howmany.js', 'games/match.js', 'games/size.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(e.request);
    const network = fetch(e.request).then(res => {
      if (res.status === 200) cache.put(e.request, res.clone());
      return res;
    });
    if (cached) {
      e.waitUntil(network.catch(() => {}));
      return cached;
    }
    return network;
  }));
});
