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

function openPublicLibraryPanel() {
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

  const element = `
      <div
        id="publicLibrary"
        class="fixed top-2 bottom-0 left-1 right-1 bg-transparent flex flex-col justify-start items-center bottom-hidden overflow-auto z-20"
      >
        <div
          class="rounded-t-xl flex flex-col justify-start items-center h-full backdrop-blur-sm bg-black/60 w-panel overflow-auto"
        >
          <div class="w-10 min-h-1 rounded-full mt-3 bg-white opacity-50"></div>

          <div
            class="h-svh w-full grid grid-cols-[2.3rem_auto_2.3rem] grid-rows-[4rem_auto_2rem] overflow-hidden"
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
                <span id="book-count"> 0 </span>
              </div>
            </div>
            <div></div>
            <div></div>
            <div id="area" class="min-h-[calc(100svh-4rem-1rem)] overflow-auto pb-10">
              <div id="links"></div>
              <div id="content" class="grid grid-cols-2 mt-7 gap-5">
                ${booksHtml}
              </div>
            </div>
            <div></div>
          </div>
        </div>
      </div>
  `

  const additionalScreen = document.getElementById('additional-screen')

  const div = document.createElement('div')

  additionalScreen.appendChild(div)
  div.outerHTML = element

  //opens from bottom to top
  document.getElementById('publicLibrary').classList.remove('bottom-hidden')
  document.getElementById('publicLibrary').classList.add('open-to-top')

  document.getElementById('publicLibraryClose').onclick = e => {
    document.getElementById('publicLibrary').classList.remove('open-to-top')
    document.getElementById('publicLibrary').classList.add('close-to-bottom')
  }
}
