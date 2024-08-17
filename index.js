try {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then(registration => {
          console.log('Service Worker registered with scope:', registration.scope)
        })
        .catch(error => {
          console.log('Service Worker registration failed:', error)
        })
    })
  }
} catch (error) {
  alert(error)
}

let bookName = localStorage.getItem('bookName')
if (bookName === null) window.location.href = window.location.href + '/library.html'

document.getElementById('bookName').innerText = bookName
document.getElementsByTagName('title')[0].innerText = bookName

let bookPath = "Things to One's Self - Marcus Aurelius"

{
  let result = localStorage.getItem('bookPath')
  bookPath = result !== null && result !== '' ? result : bookPath
}

let index = 0

const windowWidth = window.innerWidth
const windowHeight = window.innerHeight

// Get the computed font size (which 1rem is based on)
const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize)

// Calculate 4rem in pixels
const fourRemInPixels = 4 * rootFontSize

// Subtract 4rem from innerHeight
const adjustedHeight = windowHeight - fourRemInPixels

// Load the opf
let book = ePub()
let rendition

async function checkEpubExists(url) {
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
        resolve(!!event.target.result) // Returns true if the book exists, false otherwise
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

async function loadBook(url = 'Things to Ones Self - Marcus Aurelius.epub') {
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

  // Render the book
  rendition = book.renderTo('viewer', {
    width: '100%',
    height: adjustedHeight,
    spread: 'always',
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

await loadBook(`${bookPath}/book.epub`)

let savedLocation = localStorage.getItem(`${bookPath}/book-location`)
if (savedLocation) {
  rendition.display(savedLocation)
} else {
  rendition.display()
}

book.ready.then(() => {
  let next = document.getElementById('next')

  next.addEventListener(
    'click',
    function (e) {
      book.package.metadata.direction === 'rtl' ? rendition.prev() : rendition.next()
      e.preventDefault()
    },
    false
  )

  let prev = document.getElementById('prev')
  prev.addEventListener(
    'click',
    function (e) {
      book.package.metadata.direction === 'rtl' ? rendition.next() : rendition.prev()
      e.preventDefault()
    },
    false
  )

  let keyListener = function (e) {
    // Left Key
    if ((e.keyCode || e.which) == 37) {
      book.package.metadata.direction === 'rtl' ? rendition.next() : rendition.prev()
    }

    // Right Key
    if ((e.keyCode || e.which) == 39) {
      book.package.metadata.direction === 'rtl' ? rendition.prev() : rendition.next()
    }
  }

  rendition.on('keyup', keyListener)
  document.addEventListener('keyup', keyListener, false)
})

let title = document.getElementById('title')

rendition.on('relocated', location => {
  let next =
    book.package.metadata.direction === 'rtl'
      ? document.getElementById('prev')
      : document.getElementById('next')
  let prev =
    book.package.metadata.direction === 'rtl'
      ? document.getElementById('next')
      : document.getElementById('prev')

  if (location.atEnd) {
    next.style.visibility = 'hidden'
  } else {
    next.style.visibility = 'visible'
  }

  if (location.atStart) {
    prev.style.visibility = 'hidden'

    previousButton.disabled = false
  } else {
    prev.style.visibility = 'visible'
  }

  if (location && location.start) {
    index = location.start.href
    localStorage.setItem(`${bookPath}/book-location`, location.start.cfi)

    document
      .getElementById('menu')
      .querySelectorAll('a')
      .forEach(a => a.classList.remove('active'))

    document.getElementById(`a-${index}`)?.classList.add('active')
  }

  addEventListener()
})

rendition.on('layout', function (layout) {
  let viewer = document.getElementById('viewer')

  if (layout.spread) {
    viewer.classList.remove('single')
  } else {
    viewer.classList.add('single')
  }
})

window.addEventListener('unload', () => {
  console.log('unloading')
  this.book.destroy()
})

book.loaded.navigation.then(toc => {
  let indexElement = document.getElementById('index')
  const as = []

  toc.forEach(chapter => {
    const a = document.createElement('a')
    a.textContent = chapter.label
    a.setAttribute('id', `a-${chapter.href}`)

    a.addEventListener('click', e => {
      rendition.display(chapter.href)
    })

    if (chapter.href === index) a.classList.add('active')

    as.push(a)
  })

  as.forEach(a => {
    indexElement.appendChild(a)
    a.addEventListener('click', e => {
      closeMenu()

      as.forEach(aa => {
        aa.classList.remove('active')
      })
      a.classList.add('active')
    })
  })
})

let response

try {
  response = await caches.match(url)
} catch (error) {}

if (!response) response = await fetch('themes.css')

const cssBlob = await response.blob()

const blobUrl = URL.createObjectURL(cssBlob)

rendition.themes.register('dark', blobUrl)
rendition.themes.register('light', blobUrl)
rendition.themes.register('tan', blobUrl)

rendition.themes.select('dark')
//rendition.themes.fontSize('90%')

const nextButton = document.getElementById('next')
const previousButton = document.getElementById('prev')

nextButton.onclick = nextPage
previousButton.onclick = prevPage

async function nextPage(e) {
  nextButton.disabled = true
  rendition.next()

  nextButton.disabled = false
}

async function prevPage(e) {
  previousButton.disabled = true
  rendition.prev()

  previousButton.disabled = false
}

document.getElementById('menuButton').onclick = closeMenu

document.getElementById('close').onclick = closeMenu

function closeMenu() {
  if (document.getElementById('menu').classList.contains('start')) {
    document.getElementById('menu').classList.remove('start')
    document.getElementById('menu').classList.toggle('open')
    document.getElementById('cover').classList.toggle('hidden')
    return
  }

  document.getElementById('menu').classList.toggle('close')
  document.getElementById('menu').classList.toggle('open')
  document.getElementById('cover').classList.toggle('hidden')
}

function changePage(e) {
  switch (e.target.id) {
    case 'cover':
      closeMenu()
    case 'menu':
      return

    default:
      break
  }

  switch (e.target.tagName.toLowerCase()) {
    case 'path':
    case 'svg':
    case 'button':
    case 'a':
      return

    default:
      break
  }

  const screenWidth = window.innerWidth
  const rect = e.target.getBoundingClientRect()
  const clickX = e.clientX - rect.left

  const minWidth = 100

  let cutout = screenWidth * 0.3
  cutout = cutout < minWidth ? minWidth : cutout

  if (clickX < screenWidth / 2 - cutout / 2) {
    console.log('up')
    prevPage()
  } else if (clickX > screenWidth / 2 + cutout / 2) {
    console.log('pop')
    nextPage()
  } else {
    console.log('no action')
  }
}

let startX, startY, endX, endY
const minHorizontalSwipe = 50 // Minimum swipe distance in pixels
const maxVerticalSwipe = 30 // Maximum vertical movement allowed

async function addEventListener() {
  /*try {
    const iframe = document.querySelector('iframe')
    let iframeDocument = iframe.contentDocument || iframe.contentWindow.document

    // Get the body of the iframe's document
    let iframeBody = iframeDocument.body

    try {
      iframeDocument.removeEventListener('touchstart', handleTouchStart)
    } catch (error) {}

    try {
      iframeDocument.removeEventListener('touchend', handleTouchEnd)
    } catch (error) {}

    try {
      iframeBody.removeEventListener('onclick', changePage)
      iframeDocument.removeEventListener('onclick', changePage)
    } catch (error) {}

    iframeDocument.addEventListener('onclick', changePage)
    iframeBody.addEventListener('onclick', changePage)
    ///iframeDocument.addEventListener('touchstart', handleTouchStart)
    //iframeDocument.addEventListener('touchend', handleTouchEnd)
  } catch (error) {
    setTimeout(addEventListener, 100)
  }*/
}

function handleTouchStart(e) {
  startX = e.touches[0].clientX
  startY = e.touches[0].clientY
}

function handleTouchEnd(e) {
  endX = e.changedTouches[0].clientX
  endY = e.changedTouches[0].clientY
  handleSwipe()
}

document.body.addEventListener('click', changePage)
document.addEventListener('touchstart', handleTouchStart)
document.addEventListener('touchend', handleTouchEnd)

// Register a hook to capture mouse events
rendition.hooks.content.register(contents => {
  contents.document.addEventListener('click', changePage)
  contents.document.addEventListener('touchstart', handleTouchStart)
  contents.document.addEventListener('touchend', handleTouchEnd)
})

function handleSwipe() {
  const deltaX = endX - startX
  const deltaY = Math.abs(endY - startY)
  if (Math.abs(deltaX) > minHorizontalSwipe && deltaY < maxVerticalSwipe) {
    if (deltaX > 0) {
      console.log('Swiped right')
      prevPage()
    } else {
      console.log('Swiped left')
      nextPage()
    }
  }
}
