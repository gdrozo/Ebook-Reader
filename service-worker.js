const SERVER_PATH = 'Ebook-Reader'
//const SERVER_PATH = ''
const CACHE_NAME = 'epub-reader-cache-v1'
const urlsToCache = [
  `${SERVER_PATH}/`,
  `${SERVER_PATH}/index.html`,
  `${SERVER_PATH}/css/custom.css`,
  `${SERVER_PATH}/index.js`,
  `${SERVER_PATH}/libs/jszip.min.js`,
  `${SERVER_PATH}/libs/epub.js`,
  `${SERVER_PATH}/security.js`,
  `${SERVER_PATH}/books.js`,
  `${SERVER_PATH}/css/themes.css`,
  // Add other assets here
]

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
