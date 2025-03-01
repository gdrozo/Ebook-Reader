registerServiceWorker()

let bookName, bookPath, book, rendition

async function loadCurrentBook() {
  let localStorageInfo = getLocalStorageInfo()
  bookName = localStorageInfo.bookName
  bookPath = localStorageInfo.bookPath

  document.getElementById('bookName').innerText = bookName
  document.getElementById('menuBookName').innerText = bookName
  document.getElementsByTagName('title')[0].innerText = bookName

  let index = 0

  let { book: b, rendition: r } = await loadBook(bookPath)

  book = b
  rendition = r

  window.rendition = rendition

  let savedLocation = localStorage.getItem(`${bookPath}/book-location`)
  if (savedLocation) {
    rendition.display(savedLocation)
  } else {
    rendition.display()
  }

  book.ready.then(() => {
    let keyListener = function (e) {
      // Left Key
      if ((e.keyCode || e.which) == 37) {
        book.package.metadata.direction === 'rtl'
          ? rendition.next()
          : rendition.prev()
      }

      // Right Key
      if ((e.keyCode || e.which) == 39) {
        book.package.metadata.direction === 'rtl'
          ? rendition.prev()
          : rendition.next()
      }
    }

    rendition.on('keyup', keyListener)
    document.addEventListener('keyup', keyListener, false)
  })

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

      try {
        previousButton.disabled = false
      } catch (error) {}
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
        toggleMenu()

        as.forEach(aa => {
          aa.classList.remove('active')
        })
        a.classList.add('active')
      })
    })
  })
}

async function registerTheme() {
  let response

  try {
    response = await caches.match('css/themes.css')
  } catch (error) {}

  if (!response) response = await fetch('css/themes.css')

  const cssBlob = await response.blob()

  const blobUrl = URL.createObjectURL(cssBlob)

  rendition.themes.register('dark', blobUrl)
  rendition.themes.register('light', blobUrl)
  rendition.themes.register('tan', blobUrl)

  rendition.themes.select('dark')

  rendition.themes.fontSize(textSize + 'px')
}

try {
  await loadCurrentBook()
  await registerTheme()

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

  document.getElementById('menuButton').onclick = toggleMenu

  document.getElementById('close').onclick = toggleMenu
  document.getElementById('cover').onclick = changePage

  function toggleMenu() {
    if (document.getElementById('menu').classList.contains('left-hidden')) {
      document.getElementById('menu').classList.remove('left-hidden')
      document.getElementById('menu').classList.add('open-to-right')
      document.getElementById('cover').classList.remove('hidden')
      return
    }

    document.getElementById('menu').classList.add('close-to-left')
    document.getElementById('menu').classList.remove('open-to-right')
    document.getElementById('cover').classList.add('hidden')
    document.getElementById('menu').classList.add('left-hidden')
  }

  function changePage(e) {
    switch (e.target.id) {
      case 'cover':
        toggleMenu()
        return
      case 'library':
        closeLibrary()
        return
      case 'menu':
        return

      default:
        break
    }

    if (!document.getElementById('cover').classList.contains('hidden')) return

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
    const clickX = e.clientX

    let cutout = screenWidth * 0.3
    cutout = cutout < 100 ? screenWidth * 0.2 : cutout

    if (clickX < cutout) {
      console.log('up')
      prevPage()
    } else if (clickX > screenWidth - cutout) {
      console.log('pop')
      nextPage()
    } else {
      console.log('no action')
    }
  }

  let startX, startY, endX, endY
  const minHorizontalSwipe = 50 // Minimum swipe distance in pixels
  const maxVerticalSwipe = 30 // Maximum vertical movement allowed

  function handleTouchStart(e) {
    startX = e.touches[0].clientX
    startY = e.touches[0].clientY
  }

  function handleTouchEnd(e) {
    endX = e.changedTouches[0].clientX
    endY = e.changedTouches[0].clientY
    handleSwipe()
  }

  document.getElementById('navigation').addEventListener('click', changePage)
  document
    .getElementById('navigation')
    .addEventListener('touchstart', handleTouchStart)
  document
    .getElementById('navigation')
    .addEventListener('touchend', handleTouchEnd)

  // Register a hook to capture mouse events
  /*rendition.hooks.content.register(contents => {
  contents.document.addEventListener('click', changePage)
  contents.document.addEventListener('touchstart', handleTouchStart)
  contents.document.addEventListener('touchend', handleTouchEnd)
})*/

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
} catch (error) {}

setUpLibraryPanel()
function setUpLibraryPanel() {
  const library = document.getElementById('library')

  document.getElementById('libraryButton').onclick = e => {
    document.getElementById('cover').classList.remove('hidden')
    library.classList.remove('bottom-hidden')
    library.classList.add('open-to-top')
  }

  const libraryCloseButton = document.getElementById('libraryCloseButton')
  libraryCloseButton.onclick = closeLibrary

  const bookCount = document.getElementById('book-count')
  bookCount.innerText = `${books.length}`

  const content = document.getElementById('content')
  books.forEach(book => {
    let coverUrl = book.cover

    const html = `
        <img
            class=""
            src="${coverUrl}"
            class="rounded-md"
            alt=""
            srcset=""
        />
        <div class="mt-2 text-xs text-center text-gray-400">
            ${book.name}
        </div>`
    const button = document.createElement('button')
    button.innerHTML = html
    content.prepend(button)

    button.onclick = e => {
      localStorage.setItem('bookPath', book.bookPath)
      localStorage.setItem('bookName', book.name)
      window.location.href = window.location.href.replace('library.html', '')
    }
  })

  let startY

  library.addEventListener('touchstart', function (e) {
    startY = e.touches[0].clientY
  })

  library.addEventListener('touchmove', function (e) {
    let moveY = e.touches[0].clientY
    if (moveY - startY > 50) {
      // Adjust the threshold as needed
      library.classList.remove('open-to-top')
      library.classList.add('close-to-bottom')
    }
  })
}

function closeLibrary() {
  document.getElementById('cover').classList.add('hidden')
  const library = document.getElementById('library')

  library.classList.remove('open-to-top')
  library.classList.add('close-to-bottom')
}

// Add book
document.getElementById('addBook').onclick = async e => {
  const inputElement = document.getElementById('bookInput')

  //click input
  inputElement.click()

  inputElement.addEventListener('change', function (e) {
    const file = inputElement.files[0]
    if (window.FileReader) {
      const reader = new FileReader()
      reader.readAsArrayBuffer(file)

      reader.onload = async function (e) {
        const bookData = e.target.result
        //getting the file name
        const fileName = file.name

        await storeEpub(fileName, bookData)

        const coverBlob = await getEpubCover(bookData)

        const bookName = fileName.replace('.epub', '')
        const bookRef = {
          name: bookName,
          cover: coverBlob,
          bookPath: fileName,
        }
        await storeBookToList(bookRef)

        console.log(bookData)

        localStorage.setItem('bookPath', bookRef.bookPath)
        localStorage.setItem('bookName', bookRef.name)
        window.location.href = window.location.href.replace('library.html', '')
      }
    }
  })
}
