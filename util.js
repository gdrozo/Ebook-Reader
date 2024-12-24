const SERVER_PATH = '/Ebook-Reader'

function getSystemInfo() {
  const windowWidth = window.innerWidth
  const windowHeight = window.innerHeight
  // Get the computed font size (which 1rem is based on)
  const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize)

  return { windowWidth, windowHeight, rootFontSize }
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function getFilesInCache(cacheName) {
  try {
    // Open the specified cache.
    const cache = await caches.open(cacheName)

    // Get all the requests (keys) in the cache.
    const requests = await cache.keys()

    // Extract the URLs from the requests.
    const urls = requests.map(request => request.url)

    return urls
  } catch (error) {
    console.error(`Error getting files from cache '${cacheName}':`, error)
    return [] // Return an empty array on error
  }
}
