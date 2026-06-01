const CACHE_NAME = 'iiui-lost-found-v1';
const urlsToCache = [
  '/IIUI-LOST-FOUND/',
  '/IIUI-LOST-FOUND/index.html',
  '/IIUI-LOST-FOUND/css/style.css',
  '/IIUI-LOST-FOUND/js/api.js',
  '/IIUI-LOST-FOUND/js/auth.js',
  '/IIUI-LOST-FOUND/js/app.js',
  '/IIUI-LOST-FOUND/js/items.js',
  '/IIUI-LOST-FOUND/js/dashboard.js',
  '/IIUI-LOST-FOUND/js/admin.js',
  '/IIUI-LOST-FOUND/iiui-logo.jpg',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install event - cache files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache).catch(err => {
          console.log('Cache addAll error:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip API calls - always go to network
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(err => {
          // If network fails, show offline message
          if (event.request.destination === 'document') {
            return caches.match('/IIUI-LOST-FOUND/index.html');
          }
        })
    );
    return;
  }

  // For everything else - cache first, fallback to network
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version if available
        if (response) {
          return response;
        }

        // Otherwise fetch from network
        return fetch(event.request).then(response => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200) {
            return response;
          }

          // Cache successful responses
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(err => {
        // Return offline page if both cache and network fail
        return caches.match('/IIUI-LOST-FOUND/index.html')
          .catch(() => new Response('Offline - Page not available', { status: 503 }));
      })
  );
});
