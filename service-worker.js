//const SERVER_PATH = ''
const CACHE_NAME = 'epub-reader-cache-v2'
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
console.log('Service Worker Working')

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)))
})

self.addEventListener('fetch', event => {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: 'fetchLog', payload: 'Fetch event for:' + event.request.url })
    })
  })
  console.log('Fetch event for:', event.request.url)
  const fetchLog = {
    url: event.request.url,
    timestamp: Date.now(),
    method: event.request.method,
  }

  event.respondWith(
    caches.match(event.request).then(async cachedResponse => {
      if (cachedResponse) {
        fetchLog.source = 'cache'
      }

      try {
        const networkResponse = await fetch(event.request)

        if (!networkResponse || networkResponse.status !== 200) {
          console.warn('Invalid network response:', networkResponse.status, event.request.url)
          return networkResponse
        }

        fetchLog.source = 'network'

        const responseToCache = networkResponse.clone()
        caches
          .open(CACHE_NAME)
          .then(cache => {
            cache
              .put(event.request, responseToCache)
              .then(() => {
                console.log('Cached:', event.request.url)
              })
              .catch(err => {
                console.error('Error caching:', err, event.request.url)
              })
          })
          .catch(err => {
            console.error('Error opening cache:', err)
          })

        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({ type: 'fetchLog', payload: fetchLog })
          })
        })

        return networkResponse || cachedResponse || fetch(event.request)
      } catch (error) {
        console.error('Fetch failed:', error, event.request.url)
        return caches.match('/index.html') // Fallback to offline page
      }
    })
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
