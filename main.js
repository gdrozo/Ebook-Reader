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
  if (id < 0) throw Error('under 0')

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
  cover.style.height = `0px`

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

    if (isOutTop(topElement)) {
      let toGoDown = 0
      let innerElements = [topElement]
      for (let i = 0; i < innerElements.length; i++) {
        const innerElement = innerElements[i]
        innerElements = [...innerElements, ...innerElement.children]

        if (innerElement.innerText === '') {
          const elementRectangle = innerElement.getBoundingClientRect()
          if (elementRectangle.height > 0) {
            toGoDown = areaRect.top - elementRectangle.top
          }
          continue
        }

        if (!hasDirectText(innerElement)) continue

        const elBottom = innerElement.getBoundingClientRect().bottom
        if (elBottom <= areaRect.top) continue

        let lineHight = round(getLineHeight(innerElement))

        const visibleElementHeight = getVisibleHeight(innerElement, area)
        const lineOut = !isWholeNumber(round(visibleElementHeight / lineHight))

        if (!lineOut) {
          continue
        }

        //        addMarker(elBottom, 'element bottom')

        const possibleLines = Math.ceil(visibleElementHeight / lineHight)
        const wantedHeight = possibleLines * lineHight

        const localToGoDown = wantedHeight - visibleElementHeight

        if (localToGoDown > toGoDown) {
          decorate(innerElement)
          toGoDown = localToGoDown
        }
      }
      translateY += toGoDown
      translateContent()
    } else if (isOutBottom(topElement)) {
      decorate(topElement)

      let topViablePoint = -1

      let innerElements = [topElement]
      for (let i = 0; i < innerElements.length; i++) {
        const innerElement = innerElements[i]

        if (innerElement.innerText === '') {
          const elementRectangle = innerElement.getBoundingClientRect()
          if (elementRectangle.height > 0 && elementRectangle.top > topViablePoint) {
            topViablePoint = elementRectangle.top
          }
          continue
        }

        innerElements = [...innerElements, ...innerElement.children]
        if (!hasDirectText(innerElement)) continue

        const elementRectangle = innerElement.getBoundingClientRect()
        if (elementRectangle.top >= areaRect.bottom) continue

        let elementLineHeight = getLineHeight(innerElement)

        const visibleElementHeight = getVisibleHeight(innerElement, area)

        if (
          visibleElementHeight / elementLineHeight < 0.9 &&
          innerElement.innerText !== '' &&
          elementRectangle.bottom > areaRect.bottom
        ) {
          decorate(innerElement)

          if (topViablePoint > elementRectangle.top || topViablePoint === -1)
            topViablePoint = elementRectangle.top + -3
        } else {
          const possibleLines = Math.floor(visibleElementHeight / elementLineHeight + 0.1)
          const wantedHeight = possibleLines * elementLineHeight

          const cutLine = elementRectangle.top + wantedHeight

          if (cutLine > topViablePoint) topViablePoint = cutLine
        }
      }
      if (topViablePoint === -1) cover.style.height = `2px`
      else cover.style.height = `${areaRect.bottom - topViablePoint + 2}px`
      found = true
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
    try {
      await setIndexPage(indexPage - 1)
      translateY = -(content.getBoundingClientRect().height - areaRect)
      translateContent()
    } catch (error) {}
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

  translateY = parseFloat(localStorage.getItem(`${bookPath}/translateY`))
  translateY = isNaN(translateY) ? 0 : translateY

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

pageNumber.addEventListener('mousedown', async () => {
  // Start the timer
  page = 1
  localStorage.setItem(`${bookPath}/page`, `${1}`)
  pageNumber.innerText = `${1}`
  translateY = 0
  cover.style.height = `0px`

  await setIndexPage(0)
})

function addMarker(position, text) {
  const marker = document.createElement('div')
  marker.classList.add(
    'absolute',
    'left-1',
    'right-1',
    'border-t-2',
    'border-red',
    'text-white',
    'border-dashed'
  )
  marker.style.top = `${position}px`

  marker.innerHTML = `<span class="bg-black">${text}</span>`

  document.body.append(marker)
}
