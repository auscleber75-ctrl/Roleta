const CACHE_NAME = 'roleta-iap-v1';
const urlsToCache = [
  './',
  './index.html',
  './IMG_4124.jpeg',
  './IMG_4123.jpeg',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;800&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
