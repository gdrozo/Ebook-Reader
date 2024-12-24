//const SERVER_PATH = ''
const CACHE_NAME = 'epub-reader-cache-v2'
const urlsToCache = [
  `./`,
  `./index.html`,
  `./css/output.css`,
  `./index.js`,
  `./service-worker.js`,
  `./libs/jszip.min.js`,
  `./libs/epub.js`,
  `./css/themes.css`,
  // Add other assets here
]
//const urlsToCache = []
console.log('Service Worker Working')

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)))
})

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(
      response =>
        response ||
        fetch(event.request).then(fetchedResponse => {
          if (
            !fetchedResponse ||
            fetchedResponse.status !== 200 ||
            fetchedResponse.type !== 'basic'
          ) {
            return fetchedResponse
          }
          const responseToCache = fetchedResponse.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache))
          return fetchedResponse
        })
    )
  )
})
