/**
 * VocalMaster Pro Service Worker
 * Implements a Cache-First strategy for static assets (scripts, styles, images, audio, fonts)
 * and offline fallback for navigation requests to ensure reliable offline functionality.
 */

const CACHE_NAME = 'vocalmaster-cache-v2';
const STATIC_CACHE_NAME = 'vocalmaster-static-v2';

// Core assets required for immediate offline shell bootstrap
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/icon.svg',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
];

// Helper: Determine if a request is for a static asset
function isStaticAsset(url, destination) {
  if (['style', 'script', 'image', 'font', 'audio', 'video'].includes(destination)) {
    return true;
  }
  return /\.(?:js|css|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot|ico|mp3|wav|ogg|json)$/i.test(url.pathname);
}

// Install Event: Precache core shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS).catch((err) => {
          console.warn('[Service Worker] Partial precache warning:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event: Clear obsolete caches and take immediate control of clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheKeys) => {
        return Promise.all(
          cacheKeys.map((key) => {
            if (key !== CACHE_NAME && key !== STATIC_CACHE_NAME) {
              return caches.delete(key);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch Event: Apply Cache-First for static assets, Network-First with offline fallback for navigation
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Ignore non-GET requests and unsupported protocols (like chrome-extension)
  if (request.method !== 'GET' || !request.url.startsWith('http')) {
    return;
  }

  const url = new URL(request.url);

  // 1. API routes (/api/*): Network only or network-first with JSON error fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({
            error: 'Offline mode active. This feature requires an internet connection.',
            offline: true,
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      })
    );
    return;
  }

  // 2. Static Assets: Cache-First Strategy
  // Check the cache first. If found, return cached response immediately.
  // If not found, fetch from network, update cache in background, and return response.
  if (isStaticAsset(url, request.destination)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Optional: background revalidation for non-hashed resources
          if (!url.pathname.includes('/assets/')) {
            fetch(request)
              .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                  const responseClone = networkResponse.clone();
                  caches.open(STATIC_CACHE_NAME).then((cache) => {
                    cache.put(request, responseClone);
                  });
                }
              })
              .catch(() => {
                // Ignore background fetch error when offline
              });
          }
          return cachedResponse;
        }

        // Cache miss: Fetch from network and cache for next time
        return fetch(request)
          .then((networkResponse) => {
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }
            const responseToCache = networkResponse.clone();
            caches.open(STATIC_CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
            return networkResponse;
          })
          .catch((err) => {
            console.warn('[Service Worker] Cache-First fetch failed for asset:', request.url, err);
            return new Response('Asset unavailable offline', {
              status: 404,
              statusText: 'Not Found',
            });
          });
      })
    );
    return;
  }

  // 3. Navigation / HTML pages: Network-First with cached offline shell fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Return cached main page / shell when offline
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            return caches.match('/index.html').then((indexResponse) => {
              if (indexResponse) {
                return indexResponse;
              }
              return caches.match('/');
            });
          });
        })
    );
    return;
  }

  // 4. Default: Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If network fails and no cached response exists
          return cachedResponse || new Response('Offline', { status: 503, statusText: 'Offline' });
        });

      return cachedResponse || fetchPromise;
    })
  );
});
