const CACHE_NAME = 'mareas-v2';
const BASE_PATH = '/mareas_santaana';
const URLS_TO_CACHE = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/css/styles.css`,
  `${BASE_PATH}/js/app.js`,
  `${BASE_PATH}/data/mareas.json`,
  `${BASE_PATH}/manifest.json`
];

// Instalación: cachear archivos estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache abierto:', CACHE_NAME);
        return cache.addAll(URLS_TO_CACHE)
          .catch(error => {
            console.log('Error cacheando archivos:', error);
            return Promise.resolve();
          });
      })
      .then(() => self.skipWaiting())
  );
});

// Activación: limpiar caches antiguos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Borrando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: servir del cache, fallback a red
self.addEventListener('fetch', (event) => {
  // No cachear requests no-GET
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retornar del cache si existe
        if (response) {
          // Intentar actualizar el cache en background
          fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(event.request, networkResponse.clone());
                  });
              }
            })
            .catch(() => {
              // Error de red, ignorar
            });
          
          return response;
        }

        // Si no está en cache, intentar de la red
        return fetch(event.request)
          .then((response) => {
            // No cachear respuestas inválidas
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // Cachear respuesta exitosa
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Red no disponible, servir página offline
            if (event.request.destination === 'document') {
              return caches.match(`${BASE_PATH}/index.html`);
            }
            return null;
          });
      })
  );
});

// Actualización en background
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});