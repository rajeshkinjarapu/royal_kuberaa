self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  // Simple pass-through fetch to satisfy PWA criteria without complex caching issues
  e.respondWith(fetch(e.request).catch(() => new Response("Offline Mode")));
});
