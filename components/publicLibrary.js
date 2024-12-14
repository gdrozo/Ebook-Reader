//display the public library
document.getElementById('goToPublicLibrary').onclick = openPublicLibraryPanel

async function selectBook(bookPath, bookName, cover) {
  const bookRef = {
    name: bookName,
    cover: cover,
    bookPath: bookPath,
  }
  await storeBookToList(bookRef)

  localStorage.setItem('bookPath', bookPath)
  localStorage.setItem('bookName', bookName)
  window.location.href = window.location.href.replace('library.html', '')
}

//openPublicLibraryPanel()

function renderBooksHtml() {
  let booksHtml = ''

  displayBooks.forEach(book => {
    let coverUrl = book.cover

    const html =
      `
    <button onclick=" selectBook(` +
      '`' +
      `${book.bookPath}` +
      '`, `' +
      `${book.name}` +
      '`, `' +
      `${book.cover}` +
      '`' +
      `)">
      <img src="${coverUrl}" class="rounded-md" alt="" srcset="" />
      <div class="mt-2 text-xs text-center text-gray-400">
          ${book.name}
      </div>
    </button>
    `

    booksHtml += html
  })

  return booksHtml
}

function openPublicLibraryPanel() {
  const additionalScreen = document.getElementById('additional-screen')

  const div = document.createElement('div')

  additionalScreen.appendChild(div)

  const booksHtml = renderBooksHtml()

  const element = `
<div
  id="publicLibrary"
  class="fixed top-2 bottom-0 left-0 right-0 bg-transparent flex flex-col justify-start items-center bottom-hidden overflow-auto z-20"
>
  <div
    class="rounded-t-xl flex flex-col justify-start items-center h-full backdrop-blur-sm bg-black/60 w-panel overflow-auto"
  >
    <div class="w-10 min-h-1 rounded-full mt-3 bg-white opacity-50"></div>
    <div
      class="h-svh w-full grid grid-cols-[2.3rem_auto_2.3rem] grid-rows-[4rem_2.5rem_auto_2rem] overflow-hidden"
    >
      <div></div>
      <div class="grid grid-cols-[1fr_auto_1fr] items-end z-10">
        <button class="flex justify-start pb-4" id="publicLibraryClose">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            class="size-6"
          >
            <path
              fill-rule="evenodd"
              d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
        <div class="pb-4">Public Library</div>
        <div class="flex justify-end pb-4">
          <span></span>
        </div>
      </div>
      <div></div>
      <div></div>
      <div class="grid grid-cols-[auto_2.3rem] border border-[#9ca3af48] focus:border-[#9ca3af] h-9 rounded-lg px-2 bg-black/60">  
        <input
          type="text"
          id="searchInput"
          class="w-px-2 rounded-l-lg bg-transparent text-white  focus:outline-none"
          placeholder="Search books..."
        />
        <button
          id="searchButton"
          class=" w-9 rounded-lg  flex justify-center items-center ml-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </button>
      </div>
      <div></div>
      <div></div>
      <div class="min-h-[calc(100svh-4rem-1rem)] overflow-auto pb-10">
        <div id="publicBooks" class="grid grid-cols-2 mt-7 gap-5">${booksHtml}</div>
      </div>
      <div></div>
    </div>
  </div>
</div>

  `

  div.outerHTML = element

  //opens from bottom to top
  document.getElementById('publicLibrary').classList.remove('bottom-hidden')
  document.getElementById('publicLibrary').classList.add('open-to-top')

  document.getElementById('publicLibraryClose').onclick = e => {
    document.getElementById('publicLibrary').classList.remove('open-to-top')
    document.getElementById('publicLibrary').classList.add('close-to-bottom')
  }

  document.getElementById('searchButton').addEventListener('click', searchBooks)
  document.getElementById('searchInput').addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      searchBooks()
    }
    if (event.key === 'Escape') {
      document.getElementById('publicBooks').innerHTML = renderBooksHtml()
    }
  })

  async function searchBooks() {
    const searchInput = document.getElementById('searchInput').value.trim().toLowerCase()
    if (searchInput !== '') {
      //get the start letter of the search input
      const startLetter = searchInput[0]
      //get the books that start with the start letter
      const subIndexUrl = booksIndex[startLetter]

      const subIndex = await (await fetch(subIndexUrl)).json()

      let filteredBooks = subIndex[searchInput]

      if (!filteredBooks) {
        filteredBooks = Object.values(subIndex).filter(book =>
          book.name.toLowerCase().includes(searchInput.toLowerCase())
        )
      }

      console.log('filteredBooks', filteredBooks)

      displaySearchResults(filteredBooks) // Display search results
    }
  }

  // Focus the search input
  document.getElementById('searchInput').focus()
}

/**
 * Displays the search results in a new panel.
 * @param {Array<Object>} books - An array of book objects to display.  Each object should have at least a `name` and `cover` property.
 */
function displaySearchResults(books) {
  let resultsHtml = ''
  if (books && books.length > 0) {
    books.forEach(book => {
      let coverUrl = book.cover
      const html = `
        <button onclick="selectBook('${book.bookPath}', '${book.name}', '${book.cover}')">
          <img src="${coverUrl}" class="rounded-md" alt="" srcset="" />
          <div class="mt-2 text-xs text-center text-gray-400">
            ${book.name}
          </div>
        </button>
      `
      resultsHtml += html
    })

    const contentDiv = document.getElementById('publicBooks')

    contentDiv.innerHTML = resultsHtml
  } else {
    const contentDiv = document.getElementById('publicBooks')

    contentDiv.innerHTML = '<div id="searchResults">No books found.</div>'
  }
}
