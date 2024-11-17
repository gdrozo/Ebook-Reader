//const SERVER_PATH = ''
const CACHE_NAME = 'epub-reader-cache-v1'
const urlsToCache = [
  `./`,
  `./index.html`,
  `./css/custom.css`,
  `./index.js`,
  `./service-worker.js`,
  `./libs/jszip.min.js`,
  `./libs/epub.js`,
  `./security.js`,
  `./books.js`,
  `./css/themes.css`,
  // Add other assets here
]
//const urlsToCache = []

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)))
})

self.addEventListener('fetch', event => {
  event.respondWith(
    caches
      .match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse
        }
        return fetch(event.request).then(networkResponse => {
          // Check if we received a valid response
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type !== 'basic'
          ) {
            return networkResponse
          }
          // Check if the request is for an .epub file
          if (!event.request.url.endsWith('.epub')) {
            const responseToCache = networkResponse.clone()
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache)
            })
          }
          return networkResponse
        })
      })
      .catch(() => caches.match('/index.html')) // fallback to offline page
  )
})

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME]
  event.waitUntil(
    caches.keys().then(keyList =>
      Promise.all(
        keyList.map(key => {
          if (!cacheWhitelist.includes(key)) {
            return caches.delete(key)
          }
        })
      )
    )
  )
})
