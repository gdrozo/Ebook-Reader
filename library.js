window.onload = function () {
  // Your code here

  const content = document.getElementById('content')
  books.forEach(book => {
    const html = `
        <img
            src="${book.cover}"
            class="rounded-md"
            alt=""
            srcset=""
        />
        <div class="mt-2 text-xs text-center text-gray-400">
            ${book.name}
        </div>`
    const button = document.createElement('button')
    button.innerHTML = html
    content.append(button)

    button.onclick = e => {
      window.location.href = window.location.href.replace('library.html', '')
      localStorage.setItem('bookPath', book.bookPath)
      localStorage.setItem('bookName', book.name)
    }
  })
}
