let page = 1
let indexPage = 0
const bookPath = "Things to One's Self - Marcus Aurelius"

async function fetchAndReadFile(filePath) {
  try {
    const response = await fetch(`${bookPath}\\${filePath}`)
    if (!response.ok) {
      throw new Error('Network response was not ok.')
    }
    const text = await response.text()
    return text
  } catch (error) {
    console.error('There has been a problem with your fetch operation:', error)
  }
}

let pages = []
async function fetchIndex() {
  const indexBody = await fetchAndReadFile(`content.opf`)

  let regexPattern = /<item id="id[\w\d\s]+" href="([\w\d\s-]+.[\w]+)"/g
  pages = [...indexBody.matchAll(regexPattern)]

  regexPattern = /<item id="[\w\d\s]+" href="([\w\d\s-/]+\.css+)"/g
  let css = [...indexBody.matchAll(regexPattern)]

  css.forEach(file => {
    // <link rel="stylesheet" href="tailwind_output.css" />
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = `${bookPath}/${file[1]}`
    area.children[0].append(link)
  })
}

let cutPart = 0

async function setIndexPage(id, translateY = 0) {
  if (id < 0) return

  indexPage = id
  localStorage.setItem('indexPage', `${indexPage}`)
  const rectArea = area.getBoundingClientRect()

  const page = await fetchAndReadFile(pages[id][1])

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

  content.innerHTML = body

  // Usage:
  let elements = [...content.children]

  lastOutside = null
  let i = 0
  while (i < elements.length) {
    const element = elements[i]

    i++
    const isOutside = isElementOutOfViewport(element)

    if (isOutside) {
      elements = [...element.children]
      i = 0
      lastOutside = element
    }
  }

  regexPattern = /\s+/g

  content.style.transform = 'translateY(calc(' + translateY + 'px)'
  localStorage.setItem('translateY', `${translateY}`)
  try {
    const top = lastOutside.parentElement.getBoundingClientRect().top

    const lineHeight = getLineHeight(content)

    const idealHeight = rectArea.bottom - top
    const lines = Math.floor(idealHeight / lineHeight)

    const visiblePart = rectArea.bottom - lastOutside.parentElement.getBoundingClientRect().top

    cutPart = visiblePart - lines * lineHeight

    lastOutside.parentElement.style.height = `${lines * lineHeight}px`
    lastOutside.parentElement.style.overflow = `hidden`
    lastOutside.parentElement.style.display = `block`
    //lastOutside.parentElement.style.outline = `2px red dashed`
  } catch (error) {}
}

function getLineHeight(element) {
  var style = window.getComputedStyle(element)
  var lineHeight = style.getPropertyValue('line-height')
  return parseFloat(lineHeight) // This will return the line height in pixels (e.g., "20px")
}

function isElementOutOfViewport(el) {
  const rectElement = el.getBoundingClientRect()
  const rectArea = area.getBoundingClientRect()

  return (
    rectElement.left < 0 ||
    rectElement.bottom > rectArea.bottom ||
    rectElement.right > rectArea.right
  )
}

function deleteLastWord(element, str) {
  var words = str.split(' ') // Split the string into an array of words
  words.pop() // Remove the last word
  var newStr = words.join(' ') // Join the array back into a string
  element.innerHTML = newStr
  return newStr
}

const area = document.getElementById('area')
const content = area.children[1]
let lastOutside = content

fetchIndex().then(async () => {
  const index = parseInt(localStorage.getItem('indexPage'))
  page = parseInt(localStorage.getItem('page'))
  page = isNaN(page) || page < 0 ? 0 : page

  pageNumber.innerText = `${page}`

  const translateY = parseFloat(localStorage.getItem('translateY'))
  await setIndexPage(
    isNaN(index) || index < 0 ? 0 : index,
    isNaN(translateY) || index === 0 ? 0 : translateY
  )
})

const nextButton = document.getElementById('next')
const previousButton = document.getElementById('previous')

nextButton.onclick = e => {
  nextPage(e)
}

previousButton.onclick = e => {
  previousPage(e)
}

const pageNumber = document.getElementById('page-number')

function nextPage(e) {
  page++
  localStorage.setItem('page', `${page}`)
  pageNumber.innerText = `${page}`
  const rectArea = area.getBoundingClientRect()

  if (lastOutside === null) {
    setIndexPage(indexPage + 1)
    return
  }
  lastOutside.parentElement.style.height = `auto`
  lastOutside.parentElement.style.overflow = `hidden`
  lastOutside.parentElement.style.display = `block`
  //lastOutside.parentElement.style.outline = `2px red dashed`

  let already = parseFloat(
    content.style.transform.replace('translateY(calc(-', '').replace('px', '')
  )

  if (isNaN(already)) already = 0
  const finalPosition = -(rectArea.bottom + already - cutPart - remToPx(4))
  content.style.transform = 'translateY(calc(' + finalPosition + 'px)'
  localStorage.setItem('translateY', `${finalPosition}`)
  // Usage:d
  let elements = [...content.children]

  lastOutside = null
  let i = 0
  while (i < elements.length) {
    const element = elements[i]

    i++
    const isOutside = isElementOutOfViewport(element)

    if (isOutside) {
      elements = [...element.children]
      i = 0
      lastOutside = element
    }
  }

  if (lastOutside === null) return

  regexPattern = /\s+/g

  const top = lastOutside.parentElement.getBoundingClientRect().top

  const lineHeight = getLineHeight(content)

  const idealHeight = rectArea.bottom - top
  const lines = Math.floor(idealHeight / lineHeight)

  const visiblePart = rectArea.bottom - lastOutside.parentElement.getBoundingClientRect().top

  cutPart = visiblePart - lines * lineHeight
  lastOutside.parentElement.style.height = `${lines * lineHeight}px`
  //lastOutside.parentElement.style.outline = `2px red dashed`
  lastOutside.parentElement.style.overflow = `hidden`
  lastOutside.parentElement.style.display = `block`
}

function remToPx(rem) {
  return rem * parseFloat(getComputedStyle(document.documentElement).fontSize)
}

async function previousPage(e) {
  let already = parseFloat(
    content.style.transform.replace('translateY(calc(', '').replace('px', '')
  )

  const rectArea = area.getBoundingClientRect()
  if (isNaN(already) || already >= 0 || lastOutside === null) {
    if (indexPage <= 0) {
      page = 0
      localStorage.setItem('page', `${page}`)

      pageNumber.innerText = `${page}`
      return
    }
    await setIndexPage(indexPage - 1)

    const finalPosition = -(content.getBoundingClientRect().height - rectArea.height)
    content.style.transform = 'translateY(calc(' + finalPosition + 'px)'
    localStorage.setItem('translateY', `${finalPosition}`)

    page = page <= 0 ? 0 : page - 1
    localStorage.setItem('page', `${page}`)

    pageNumber.innerText = `${page}`
    return
  }

  page = page <= 0 ? 0 : page - 1

  localStorage.setItem('page', `${page}`)

  pageNumber.innerText = `${page}`

  lastOutside.parentElement.style.height = `auto`
  lastOutside.parentElement.style.overflow = `hidden`
  lastOutside.parentElement.style.display = `block`
  //lastOutside.parentElement.style.outline = `2px red dashed`

  let finalPosition = -(Math.abs(already) - (rectArea.bottom - rectArea.top))
  finalPosition = finalPosition > 0 ? 0 : finalPosition
  content.style.transform = 'translateY(calc(' + finalPosition + 'px)'
  localStorage.setItem('translateY', `${finalPosition}`)
  // Usage:
  let elements = [...content.children]

  let i = 0
  while (i < elements.length) {
    const element = elements[i]

    i++
    const isOutside = isElementOutOfViewport(element)

    if (isOutside) {
      elements = [...element.children]
      i = 0
      lastOutside = element
    }
  }

  regexPattern = /\s+/g

  const top = lastOutside.parentElement.getBoundingClientRect().top

  const lineHeight = getLineHeight(content)

  const idealHeight = rectArea.bottom - top
  const lines = Math.floor(idealHeight / lineHeight)

  const visiblePart = rectArea.bottom - lastOutside.parentElement.getBoundingClientRect().top

  cutPart = visiblePart - lines * lineHeight
  lastOutside.parentElement.style.height = `${lines * lineHeight}px`
  //lastOutside.parentElement.style.outline = `2px red dashed`
  lastOutside.parentElement.style.overflow = `hidden`
  lastOutside.parentElement.style.display = `block`
}
