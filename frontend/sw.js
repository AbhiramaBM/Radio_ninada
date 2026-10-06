/**
 * Radio Ninada 90.4 FM - Production Service Worker
 * Enables PWA installability, background caching, and offline resilience.
 */

const CACHE_NAME = 'radio-ninada-v1.0.0';

// Core assets to pre-cache on install for instant loading
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/js/player.js',
  '/js/api-client.js',
  '/js/pwa-installer.js',
  '/manifest.json',
  '/images/radio_ninada_logo.png',
  '/images/icon-192x192.png',
  '/images/icon-512x512.png',
  '/images/icon-maskable-192x192.png',
  '/images/icon-maskable-512x512.png',
  '/images/whatsapp_logo.svg',
  '/images/instagram_logo.svg',
  '/images/facebook_logo.svg',
  '/images/youtube_logo.svg'
];

// Install Event: pre-cache shell assets & skip waiting
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use catch for individual items so failure of an optional asset doesn't break installation
      return Promise.all(
        PRECACHE_ASSETS.map((url) => {
          return cache.add(url).catch((err) => {
            console.warn('[SW] Precache item skipped:', url, err);
          });
        })
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: clean up old caches & take control of clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Smart routing & caching
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1. Only handle GET requests
  if (req.method !== 'GET') {
    return;
  }

  // 2. Never cache live audio streams or range requests
  if (
    url.hostname.includes('zeno.fm') ||
    url.hostname.includes('stream') ||
    url.pathname.endsWith('.mp3') ||
    url.pathname.endsWith('.aac') ||
    req.headers.has('range')
  ) {
    return;
  }

  // 3. API requests: network only (with error fallback)
  if (url.pathname.startsWith('/api')) {
    event.respondWith(
      fetch(req).catch(() => {
        return new Response(
          JSON.stringify({ success: false, offline: true, message: 'Offline mode' }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // 4. HTML Navigation requests (Page reload / navigation): Network-first with cache fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          const fallback = await caches.match('/index.html');
          return fallback || new Response('Offline - Radio Ninada', {
            headers: { 'Content-Type': 'text/html' }
          });
        })
    );
    return;
  }

  // 5. Static Assets (CSS, JS, Images, Fonts): Cache-first with background network update
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached asset immediately, update cache in background
        fetch(req)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(req, networkResponse));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      // Not in cache: fetch from network and cache
      return fetch(req)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, responseToCache);
          });
          return networkResponse;
        })
        .catch(() => {
          // Fallback if offline
          return caches.match(req);
        });
    })
  );
});
