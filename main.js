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

  await render()
}

async function render() {
  nextButton.disabled = true
  previousButton.disabled = true
  cover.style.height = `0px`

  content.style.opacity = '0'

  await translateContent()

  async function calculate() {
    //await new Promise(r => setTimeout(r, 10))
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

          const elRectangle = innerElement.getBoundingClientRect()
          const elementHeight = elRectangle.bottom - elRectangle.top
          const visibleMargin = elementHeight / lineHight <= 1 ? getTopMargin(innerElement) : 0

          const wantedHeight = possibleLines * lineHight + visibleMargin

          const localToGoDown = wantedHeight - visibleElementHeight

          if (localToGoDown > toGoDown) {
            decorate(innerElement)
            toGoDown = localToGoDown
          }
        }
        translateY += toGoDown

        await translateContent()
      } else if (isOutBottom(topElement)) {
        decorate(topElement)

        let innerElements = [topElement]

        let textElements = []

        for (let i = 0; i < innerElements.length; i++) {
          const innerElement = innerElements[i]

          if (innerElement.innerText === '') {
            const elementRectangle = innerElement.getBoundingClientRect()
            if (
              elementRectangle.height > 0 &&
              elementRectangle.bottom > areaRect.bottom &&
              elementRectangle.top < areaRect.bottom
            ) {
              cover.style.height = `${areaRect.bottom - topElement.getBoundingClientRect().top}px`

              return
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
            elementRectangle.bottom > areaRect.bottom &&
            visibleElementHeight / elementLineHeight < 0.9 &&
            innerElement.innerText !== ''
          ) {
            decorate(innerElement)

            cover.style.height = `${
              areaRect.bottom - elementRectangle.top + getTopMargin(innerElement)
            }px`

            return
          } else {
            textElements.push({
              top: elementRectangle.top,
              bottom: elementRectangle.bottom,
              lineHight: elementLineHeight,
              text: innerElement.innerText,
              index: textElements.length,
            })
          }
        }

        if (textElements.length === 0) {
          return
        }
        let firstElementOut = textElements[0]

        if (firstElementOut.bottom < areaRect.bottom) {
          firstElementOut = null
          for (let i = 1; i < textElements.length; i++) {
            if (textElements[i] >= areaRect.bottom) {
              firstElementOut = textElements[i]
              break
            }
          }
        }

        if (firstElementOut === null) {
          cover.style.height = `0px`
          return
        }

        let line = firstElementOut.bottom
        let valid = false
        for (let j = 0; line >= firstElementOut.top; j++) {
          line = firstElementOut.bottom - firstElementOut.lineHight * j
          if (line > areaRect.bottom) continue

          if (textElements.length === 1) {
            cover.style.height = `${areaRect.bottom - line}px`
            return
          }

          for (
            let testElementIndex = 0;
            testElementIndex < textElements.length;
            testElementIndex++
          ) {
            if (testElementIndex === firstElementOut.index) continue

            let testElement = textElements[testElementIndex]
            let testLine = testElement.bottom

            let isValid = false
            const maxLoops = 100
            if (line <= testElement.top || line >= testElement.bottom) {
              isValid = true
              valid = true
              break
            }

            for (let i = 0; testLine >= testElement.top && i <= maxLoops; i++) {
              testLine = testElement.bottom - testElement.lineHight * i
              if (testLine <= line + 0.5 && testLine >= line - 0.5) {
                isValid = true
                break
              }
            }

            if (!isValid) {
              valid = false
              break
            }
            valid = true
          }

          if (valid) {
            cover.style.height = `${areaRect.bottom - line}px`

            break
          }
        }

        if (!valid) {
          cover.style.height = `${areaRect.bottom - firstElementOut.top}px`
        }
      }
    }
    content.style.opacity = '1'
  }

  await calculate()
  nextButton.disabled = false
  previousButton.disabled = false

  content.style.opacity = '1'
}

async function translateContent() {
  content.style.transform = 'translateY(' + translateY + 'px)'
  localStorage.setItem(`${bookPath}/translateY`, translateY)

  await new Promise(r =>
    setTimeout(() => {
      r()
    }, 1)
  )
}

async function nextPage(e) {
  nextButton.disabled = true

  page++
  localStorage.setItem(`${bookPath}/page`, `${page}`)
  pageNumber.innerText = `${page}`

  const areaRect = area.getBoundingClientRect().height
  const contentRect = content.getBoundingClientRect().height

  if (contentRect <= -translateY + areaRect || contentRect <= areaRect) {
    translateY = 0
    setIndexPage(indexPage + 1)
    nextButton.disabled = false
    return
  }

  translateY -= areaRect

  await render()
  nextButton.disabled = false
}

async function previousPage(e) {
  previousButton.disabled = true

  cover.style.height = `0px`
  page = page <= 1 ? 1 : page - 1
  localStorage.setItem(`${bookPath}/page`, `${page}`)
  pageNumber.innerText = `${page}`

  const areaHeight = area.getBoundingClientRect().height
  const coverHeight = parseFloat(cover.style.height.replace('px', ''))

  if (-translateY <= 0) {
    translateY = 0
    try {
      await setIndexPage(indexPage - 1)
      cover.style.height = `0px`

      translateY = -(content.getBoundingClientRect().height - areaHeight)
      /*translateY = -(content.getBoundingClientRect().height - 20)
       */
      debugger
      translateY = translateY > 0 ? 0 : translateY
      await translateContent()
    } catch (error) {}
    previousButton.disabled = false

    return
  }

  translateY += areaHeight - coverHeight

  await render()
  previousButton.disabled = false
}

//Start of the app
fetchIndex().then(async pages => {
  if (navigator.serviceWorker && navigator.serviceWorker.ready)
    navigator.serviceWorker.ready.then(function (swRegistration) {
      syncPages(pages)
    })

  const index = parseInt(localStorage.getItem(`${bookPath}/indexPage`))
  page = parseInt(localStorage.getItem(`${bookPath}/page`))
  page = isNaN(page) || page < 1 ? 1 : page

  pageNumber.innerText = `${page}`

  translateY = parseFloat(localStorage.getItem(`${bookPath}/translateY`))
  translateY = isNaN(translateY) ? 0 : translateY

  let bookName = localStorage.getItem('bookName')
  if (bookName === null) window.location.href = '/library.html'

  bookName = bookName === null ? '' : bookName
  document.getElementById('bookName').innerText = bookName
  document.getElementsByTagName('title')[0].innerText = bookName

  setIndexPage(isNaN(index) || index < 0 ? 0 : index)
  setTimeout(() => {}, 10)
})

document.addEventListener('DOMContentLoaded', () => {
  if (navigator.serviceWorker)
    navigator.serviceWorker.onmessage = event => {
      const file = event.data.file
      const data = event.data.data
      localStorage.setItem(`${file}`, `${data}`)
    }

  screenLock()
})

pageNumber.addEventListener('mousedown', async () => {
  // Start the timer

  alert(`${window.innerWidth}x${window.innerHeight}`)
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    try {
      navigator.serviceWorker.controller.postMessage({ type: 'clear' })
    } catch (error) {
      alert(`no service worker: ${error}`)
    }
  } else alert('no service worker')

  page = 1
  localStorage.setItem(`${bookPath}/page`, `${1}`)
  pageNumber.innerText = `${1}`
  translateY = 0
  cover.style.height = `0px`

  await translateContent()

  await setIndexPage(0)
})
