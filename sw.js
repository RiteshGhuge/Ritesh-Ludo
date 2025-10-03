// sw.js - A very basic service worker
const CACHE_NAME = 'ludo-game-v1';
const urlsToCache = [
  '/',
  'index.html',
  'style.css',
  'script.js',
  'ludo-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_E_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});