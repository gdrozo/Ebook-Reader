const { windowWidth, windowHeight, rootFontSize } = getSystemInfo()

const fourRemInPixels = 3.5 * rootFontSize
const adjustedHeight = windowHeight - fourRemInPixels

function getLocalStorageInfo() {
  let bookName = localStorage.getItem('bookName')
  if (!bookName) {
    if (books.length > 0) {
      //Open the local library
    } else {
      //Open the public library
      openPublicLibraryPanel()
    }
    throw new Error('No book name found in local storage')
  }

  let bookPath = localStorage.getItem('bookPath')

  if (!bookPath.includes('.epub')) {
    bookPath = bookPath + '/book.epub'
  }

  return { bookName, bookPath }
}

async function checkEpubExists(url) {
  return new Promise((r, e) => {
    const dbName = 'EpubStorage'
    const storeName = 'epubs'
    const request = indexedDB.open(dbName, 1)

    request.onerror = event => e(event.target.error)

    request.onsuccess = event => {
      const db = event.target.result
      const transaction = db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const getRequest = store.get(url)

      getRequest.onerror = event => e(event.target.error)
      getRequest.onsuccess = event => {
        r(!!event.target.result) // Returns true if the book exists, false otherwise
      }
    }

    request.onupgradeneeded = event => {
      const db = event.target.result
      db.createObjectStore(storeName, { keyPath: 'url' })
    }
  })
}

async function storeEpub(url, epubData) {
  return new Promise((resolve, reject) => {
    const dbName = 'EpubStorage'
    const storeName = 'epubs'
    const request = indexedDB.open(dbName, 1)

    request.onerror = event => reject(event.target.error)

    request.onsuccess = async event => {
      const db = event.target.result

      try {
        const exists = await checkEpubExists(url)
        if (!exists) {
          const transaction = db.transaction([storeName], 'readwrite')
          const store = transaction.objectStore(storeName)
          const putRequest = store.put({ url: url, data: epubData })

          putRequest.onerror = event => reject(event.target.error)
          putRequest.onsuccess = () => resolve(true) // Book was stored
        } else {
          resolve(false) // Book already exists, wasn't stored
        }
      } catch (error) {
        reject(error)
      }
    }

    request.onupgradeneeded = event => {
      const db = event.target.result
      db.createObjectStore(storeName, { keyPath: 'url' })
    }
  })
}

async function loadBook(url) {
  // Load the opf
  let book = ePub()
  let rendition
  let bookData

  if (navigator.onLine) {
    // Check if the book is already stored in IndexedDB
    const exists = await checkEpubExists(url)
    if (!exists) {
      // If not stored, download and store the book
      try {
        const response = await fetch(url)
        bookData = await response.blob()
        await storeEpub(url, bookData)
      } catch (error) {
        console.error('Error downloading and storing the book:', error)
        alert('Failed to download and store the book.')
        return
      }
    } else {
      // If already stored, load from IndexedDB
      bookData = await loadFromIndexedDB(url)
    }
  } else {
    // Offline: Try to load from IndexedDB first, then from cache
    bookData = await loadFromIndexedDB(url)

    if (!bookData) {
      // If not in IndexedDB, try the cache
      const response = await caches.match(url)
      if (response) {
        bookData = await response.blob()
      } else {
        alert('This book is not available offline')
        return
      }
    }
  }

  if (!bookData) {
    alert('Failed to load the book')
    return
  }

  book.open(bookData, 'binary')

  const currentUrl = window.location.href

  // Render the book
  rendition = book.renderTo('viewer', {
    width: '100%',
    height: adjustedHeight,
    spread: 'always',
    stylesheet: `${currentUrl.includes('Ebook-Reader') ? '/Ebook-Reader' : ''}/css/injected.css`,
  })

  return { book, rendition }
}

// Helper function to load book from IndexedDB
async function loadFromIndexedDB(url) {
  return new Promise((resolve, reject) => {
    const dbName = 'EpubStorage'
    const storeName = 'epubs'
    const request = indexedDB.open(dbName, 1)

    request.onerror = event => reject(event.target.error)

    request.onsuccess = event => {
      const db = event.target.result
      const transaction = db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const getRequest = store.get(url)

      getRequest.onerror = event => reject(event.target.error)
      getRequest.onsuccess = event => {
        const result = event.target.result
        if (result) {
          resolve(result.data)
        } else {
          resolve(null)
        }
      }
    }
  })
}

// Function to unzip binary data
async function unzipBinaryData(binaryData) {
  try {
    const zip = await JSZip.loadAsync(binaryData)
    const files = {}

    for (const filename of Object.keys(zip.files)) {
      const file = zip.files[filename]
      if (!file.dir) {
        // Assuming text files, you can change this based on file types
        files[filename] = await file.async('string')
      }
    }
    return files
  } catch (error) {
    console.error('An error occurred while unzipping the data:', error)
  }
}

async function getEpubCover(bookData) {
  // Create a Blob from the binary data
  //const blob = new Blob([binaryData], { type: 'application/epub+zip' })

  // Initialize epub.js with the blob
  const book = ePub()

  book.open(bookData, 'binary')

  // Load the book
  await book.ready

  const coverUrl = book.cover.replace('/', '')
  const cover = await book.archive.zip.file(coverUrl).async('blob')
  return cover
}
