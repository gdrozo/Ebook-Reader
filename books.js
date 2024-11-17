/*const books = [
  {
    name: "Things to One's Self - Marcus Aurelius",
    cover: 'Aurelius, Marcus\\Things to One’s Self\\Things to One’s Self - Marcus Aurelius.jpg',
    bookPath: 'Aurelius, Marcus\\Things to One’s Self',
  },
  {
    name: 'The Tibetan Book of Living and Dying',
    cover:
      'Rinpoche, Sogyal\\Tibetan Book of the Living and Dying, The\\Tibetan Book of the Living and Dying, The - Sogyal Rinpoche.jpg',
    bookPath: 'Rinpoche, Sogyal\\Tibetan Book of the Living and Dying, The',
  },
  {
    name: 'Notes from Underground',
    cover:
      'Dostoevsky, Fyodor & Pevear, Richard & Volokhonsky, Larissa\\Notes from Underground\\Notes from Underground - Fyodor Dostoevsky & Richard Pevear & Larissa Volokhonsky.jpg',
    bookPath: 'Dostoevsky, Fyodor & Pevear, Richard & Volokhonsky, Larissa\\Notes from Underground',
  },
]*/

//Getting the list of books form the local storage
const booksFromLocalStorage = localStorage.getItem('books')

let books = booksFromLocalStorage
  ? JSON.parse(booksFromLocalStorage)
  : [
      {
        name: "Things to One's Self - Marcus Aurelius",
        cover: 'Aurelius, Marcus\\Things to One’s Self\\Things to One’s Self - Marcus Aurelius.jpg',
        bookPath: 'Aurelius, Marcus\\Things to One’s Self',
      },
      {
        name: 'The Tibetan Book of Living and Dying',
        cover:
          'Rinpoche, Sogyal\\Tibetan Book of the Living and Dying, The\\Tibetan Book of the Living and Dying, The - Sogyal Rinpoche.jpg',
        bookPath: 'Rinpoche, Sogyal\\Tibetan Book of the Living and Dying, The',
      },
      {
        name: 'Notes from Underground',
        cover:
          'Dostoevsky, Fyodor & Pevear, Richard & Volokhonsky, Larissa\\Notes from Underground\\Notes from Underground - Fyodor Dostoevsky & Richard Pevear & Larissa Volokhonsky.jpg',
        bookPath:
          'Dostoevsky, Fyodor & Pevear, Richard & Volokhonsky, Larissa\\Notes from Underground',
      },
    ]

function storeBookToList(book) {
  const bookIndex = books.findIndex(b => b.name === book.name)
  if (bookIndex !== -1) {
    books[bookIndex] = book
  } else {
    books.push(book)
  }

  localStorage.setItem('books', JSON.stringify(books))
  reloadBooksList()
}

function removeBookFromList(book) {
  const bookIndex = books.findIndex(b => b.name === book.name)
  if (bookIndex !== -1) {
    books.splice(bookIndex, 1)
  }

  localStorage.setItem('books', JSON.stringify(books))
}

function reloadBooksList() {
  const booksFromLocalStorage = localStorage.getItem('books')

  books = booksFromLocalStorage
    ? JSON.parse(booksFromLocalStorage)
    : [
        {
          name: "Things to One's Self - Marcus Aurelius",
          cover:
            'Aurelius, Marcus\\Things to One’s Self\\Things to One’s Self - Marcus Aurelius.jpg',
          bookPath: 'Aurelius, Marcus\\Things to One’s Self',
        },
        {
          name: 'The Tibetan Book of Living and Dying',
          cover:
            'Rinpoche, Sogyal\\Tibetan Book of the Living and Dying, The\\Tibetan Book of the Living and Dying, The - Sogyal Rinpoche.jpg',
          bookPath: 'Rinpoche, Sogyal\\Tibetan Book of the Living and Dying, The',
        },
        {
          name: 'Notes from Underground',
          cover:
            'Dostoevsky, Fyodor & Pevear, Richard & Volokhonsky, Larissa\\Notes from Underground\\Notes from Underground - Fyodor Dostoevsky & Richard Pevear & Larissa Volokhonsky.jpg',
          bookPath:
            'Dostoevsky, Fyodor & Pevear, Richard & Volokhonsky, Larissa\\Notes from Underground',
        },
      ]
}
