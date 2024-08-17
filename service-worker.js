const CACHE_NAME = 'epub-reader-cache-v1'
const urlsToCache = [
  '/',
  '/index.html',
  '/custom.css',
  '/index.js',
  '/epub.js',
  '/security.js',
  '/books.js',
  '/library.js',
  '/library.html',
  '/jszip.min.js',
  '/themes.css',
  // Add other assets here
]

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)))
})

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        return response
      }
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }
        const responseToCache = response.clone()
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache)
        })
        return response
      })
    })
  )
})
