function checkAndFetchFiles(fileList) {
  fileList.forEach(file => {
    // Check if the file is in localStorage

    // If not, fetch it and store it in localStorage
    fetch(file)
      .then(response => {
        if (response.ok) return response.text()
        throw new Error('Network response was not ok.')
      })
      .then(data => {
        sendFileToClient(file, data)
        console.log(`${file} has been fetched and stored.`)
      })
      .catch(error => {
        console.error(`There has been a problem with your fetch operation for ${file}: `, error)
      })
  })
}

function sendFileToClient(file, data) {
  //Obtain an array of Window client objects
  self.clients.matchAll().then(clients => {
    if (clients && clients.length) {
      //Respond to last focused tab
      clients[0].postMessage({ file, data })
    }
  })
}

self.addEventListener('message', event => {
  const type = event.data.type
  switch (type) {
    case 'fetch':
      const fileList = event.data.files
      checkAndFetchFiles(fileList)
      break

    case 'clear':
      caches.keys().then(cacheNames => cacheNames.forEach(cacheName => caches.delete(cacheName)))
      break
    default:
      break
  }
  // Now you have the list of files and can do something with it
})

// In your service-worker.js
const CACHE_NAME = 'cache'
const urlsToCache = [
  '/Ebook-Reader/',
  '/Ebook-Reader/index.html',
  '/Ebook-Reader/library.html',
  '/Ebook-Reader/books.js',
  '/Ebook-Reader/library.js',
  '/Ebook-Reader/security.js',
  '/Ebook-Reader/util.js',
  '/Ebook-Reader/main.js',
  '/Ebook-Reader/tailwind_output.css',
  '/Ebook-Reader/service-worker.js',
  '/Ebook-Reader/service-worker-registrator.js',
  '/Ebook-Reader/image/favicon.png',
]

self.addEventListener('install', event => {
  //caches.keys().then(cacheNames => cacheNames.forEach(cacheName => caches.delete(cacheName)))
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Opened cache')
      return cache.addAll(urlsToCache)
    })
  )
})

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }

        let responseToCache = response.clone()

        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache)
        })

        return response
      })
      .catch(async () => {
        return caches.match(event.request).then(response => {
          if (response) {
            return response
          }
          // Optionally, provide a fallback response here if both the network and cache fail
        })
      })
  )
})
