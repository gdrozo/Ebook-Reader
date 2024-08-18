const SERVER_PATH = 'Ebook-Reader'
//const SERVER_PATH = ''
const CACHE_NAME = 'epub-reader-cache-v1'
const urlsToCache = [
  SERVER_PATH + '/',
  SERVER_PATH + '/index.html',
  SERVER_PATH + '/custom.css',
  SERVER_PATH + '/index.js',
  SERVER_PATH + '/epub.js',
  SERVER_PATH + '/security.js',
  SERVER_PATH + '/books.js',
  SERVER_PATH + '/jszip.min.js',
  SERVER_PATH + '/themes.css',
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
