let page = 1
let indexPage = 0
let pages = []
let cutPart = 0
let translateY = 0

const cover = document.getElementById('cover')
const area = document.getElementById('area')
const content = area.children[1]
let lastOutside = content

const nextButton = document.getElementById('next')
const previousButton = document.getElementById('previous')
const pageNumber = document.getElementById('page-number')

nextButton.onclick = nextPage

previousButton.onclick = previousPage

//default book
let bookPath = "Things to One's Self - Marcus Aurelius"
{
  let result = localStorage.getItem('bookPath')
  bookPath = result !== null && result !== '' ? result : bookPath
}

async function fetchIndex() {
  const indexBody = await fetchAndReadFile(`content.opf`)

  let regexPattern = /<item .*href="([\w\d\s-]+.x?html)"/g
  pages = [...indexBody.matchAll(regexPattern)]

  regexPattern = /<item .*href="([\w\d\s-/]+\.css+)"/g
  let css = [...indexBody.matchAll(regexPattern)]

  css.forEach(file => {
    // <link rel="stylesheet" href="tailwind_output.css" />
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = `${bookPath}/${file[1]}`
    area.children[0].append(link)
  })

  return pages
}

async function setIndexPage(id) {
  if (id < 0) return

  indexPage = id
  localStorage.setItem(`${bookPath}/indexPage`, `${indexPage}`)

  const page = await fetchAndReadFile(pages[id][1])

  //Cleaning the received code
  let regexPattern = /<body.+>((\n|.)+)<\/body>/g

  let body = page
  try {
    body = [...page.matchAll(regexPattern)][0][1]
  } catch (error) {}

  regexPattern = /<script.*>((\n|.)+)<\/script>/g
  ;[...body.matchAll(regexPattern)].forEach(script => {
    body = body.replace(script[0], '')
  })

  regexPattern = /<link.*>/g
  ;[...body.matchAll(regexPattern)].forEach(script => {
    body = body.replace(script[0], '')
  })

  // changing the hrefs
  regexPattern = /src="([\w-.]+)"/g
  ;[...body.matchAll(regexPattern)].forEach(script => {
    body = body.replace(script[1], `${bookPath}/${script[1]}`)
  })

  content.innerHTML = body

  render()
}

async function render() {
  console.clear()

  content.style.opacity = '0'
  translateContent()

  await new Promise(r => setTimeout(r, 100))
  const areaRect = area.getBoundingClientRect()

  // Usage:
  let topElements = [...content.children]

  let found = false
  let i = 0
  while (i < topElements.length && !found) {
    const topElement = topElements[i]
    i++
    if (topElement.innerText === '') continue

    if (isOutTop(topElement)) {
      let toGoDown = 0
      let innerElements = [...topElement.children]
      for (let i = 0; i < innerElements.length; i++) {
        const el = innerElements[i]
        innerElements = [...innerElements, ...el.children]

        if (el.innerText === '') continue

        const elBottom = el.getBoundingClientRect().bottom
        if (elBottom <= areaRect.top) continue

        let lh = round(getLineHeight(el))

        const visibleElementHeight = elBottom - areaRect.top

        const lineOut = !isWholeNumber(round(visibleElementHeight / lh))

        if (!lineOut) {
          continue
        }

        const possibleLines = Math.ceil(visibleElementHeight / lh)
        const wantedHeight = possibleLines * lh
        const padding = getPaddingAndMargin(el)

        const localToGoDown = wantedHeight - visibleElementHeight + padding

        if (localToGoDown > toGoDown) {
          decorate(el)
          toGoDown = localToGoDown
        }
      }
      translateY += toGoDown
      translateContent()
    } else if (isOutBottom(topElement)) {
      decorate(topElement)

      const elementRect = topElement.getBoundingClientRect()
      let lineHeight = getLineHeight(topElement)
      let padding = 0

      let innerElements = [...topElement.children]
      for (let i = 0; i < innerElements.length; i++) {
        const el = innerElements[i]
        const elTop = el.getBoundingClientRect().top
        if (elTop >= areaRect.bottom) continue

        let lh = getLineHeight(el)

        const visibleElementHeight = areaRect.bottom - elTop

        if (visibleElementHeight / lh < 1 && el.innerText !== '') {
          decorate(el)
          lineHeight = lh
          padding = getPaddingAndMargin(el)
        }
        innerElements = [...innerElements, ...el.children]
      }

      debugger
      //Area bottom - Element top
      const visibleHeight = areaRect.bottom - elementRect.top
      const possibleLines = Math.floor((visibleHeight - padding) / lineHeight)

      const wantedHeight = possibleLines * lineHeight
      const coverUp = visibleHeight - wantedHeight
      cover.style.height = `${coverUp}px`
      found = true

      console.log('down:')
      console.log('visibleHeight', visibleHeight)
      console.log('possibleLines', possibleLines)
      console.log('wantedHeight', wantedHeight)
      console.log('lineHeight', lineHeight)
      console.log('coverUp', coverUp)
    }
  }
  content.style.opacity = '1'
}

function translateContent() {
  content.style.transform = 'translateY(' + translateY + 'px)'
  localStorage.setItem(`${bookPath}/translateY`, translateY)
}

function nextPage(e) {
  page++
  localStorage.setItem(`${bookPath}/page`, `${page}`)
  pageNumber.innerText = `${page}`

  const areaRect = area.getBoundingClientRect().height
  const contentRect = content.getBoundingClientRect().height

  if (contentRect <= -translateY + areaRect || contentRect <= areaRect) {
    translateY = 0
    setIndexPage(indexPage + 1)
    return
  }

  translateY -= areaRect
  render()
}

async function previousPage(e) {
  page = page <= 1 ? 1 : page - 1
  localStorage.setItem(`${bookPath}/page`, `${page}`)
  pageNumber.innerText = `${page}`

  const areaRect = area.getBoundingClientRect().height

  if (-translateY <= 0) {
    translateY = 0
    await setIndexPage(indexPage - 1)
    translateY = -(content.getBoundingClientRect().height - areaRect)
    translateContent()
    return
  }

  translateY += areaRect
  translateContent()
  render()
}

//Start of the app
fetchIndex().then(async p => {
  const index = parseInt(localStorage.getItem(`${bookPath}/indexPage`))
  page = parseInt(localStorage.getItem(`${bookPath}/page`))
  page = isNaN(page) || page < 1 ? 1 : page

  pageNumber.innerText = `${page}`

  const localTranslateY = parseFloat(localStorage.getItem(`${bookPath}/translateY`))
  translateY = isNaN(localTranslateY) || index === 0 ? 0 : localTranslateY

  let bookName = localStorage.getItem('bookName')
  bookName = bookName === null ? '' : bookName
  document.getElementById('bookName').innerText = bookName
  await setIndexPage(isNaN(index) || index < 0 ? 0 : index)
})

function decorate(element) {
  /*try {
    element.style.outline = '2px red dotted'
  } catch (error) {}*/
}
