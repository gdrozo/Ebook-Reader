const SERVER_PATH = 'Ebook-Reader'
//const SERVER_PATH = ''
const CACHE_NAME = 'epub-reader-cache-v1'
const urlsToCache = [
  `${SERVER_PATH}/`,
  `${SERVER_PATH}/index.html`,
  `${SERVER_PATH}/css/custom.css`,
  `${SERVER_PATH}/index.js`,
  `${SERVER_PATH}/service-worker.js`,
  `${SERVER_PATH}/libs/jszip.min.js`,
  `${SERVER_PATH}/libs/epub.js`,
  `${SERVER_PATH}/security.js`,
  `${SERVER_PATH}/books.js`,
  `${SERVER_PATH}/css/themes.css`,
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
          const responseToCache = networkResponse.clone()
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache)
          })
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
