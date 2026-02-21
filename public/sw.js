// Minimal service worker for PWA install prompt
// VastuNow doesn't need offline support — tool is useless without API

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass through all requests — no caching
  event.respondWith(fetch(event.request));
});
