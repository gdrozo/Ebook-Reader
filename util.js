async function fetchAndReadFile(filePath) {
  try {
    let text = localStorage.getItem(`${bookPath}\\${filePath}`)
    if (text === null) {
      const response = await fetch(`${bookPath}\\${filePath}`)
      if (!response.ok) {
        throw new Error('Network response was not ok.')
      }
      text = await response.text()
      localStorage.setItem(`${bookPath}\\${filePath}`, `${text}`)
    }
    return text
  } catch (error) {
    console.error('There has been a problem with your fetch operation:', error)
  }
}

function getLineHeight(element) {
  let style = window.getComputedStyle(element)
  let lineHeight = style.getPropertyValue('line-height')
  return parseFloat(lineHeight) // This will return the line height in pixels (e.g., "20px")
}

function isOutTop(element) {
  const rectElement = element.getBoundingClientRect()
  const rectArea = area.getBoundingClientRect()

  return rectElement.top < rectArea.top && rectElement.bottom > rectArea.top
}

function isOutBottom(element) {
  const rectElement = element.getBoundingClientRect()
  const rectArea = area.getBoundingClientRect()

  //Element top < area bottom
  //Element bottom > area bottom
  return rectElement.top < rectArea.bottom && rectElement.bottom > rectArea.bottom
}

function deleteLastWord(element, str) {
  let words = str.split(' ') // Split the string into an array of words
  words.pop() // Remove the last word
  let newStr = words.join(' ') // Join the array back into a string
  element.innerHTML = newStr
  return newStr
}

function remToPx(rem) {
  return rem * parseFloat(getComputedStyle(document.documentElement).fontSize)
}

function getPaddingAndMargin(element) {
  try {
    // Get the computed style of the element
    let style = window.getComputedStyle(element)

    // Get individual padding values
    let paddingTop = style.getPropertyValue('padding-top')
    let paddingBottom = style.getPropertyValue('padding-bottom')

    // Parse the values as floats to get numerical values
    let paddingTopValue = parseFloat(paddingTop)
    let paddingBottomValue = parseFloat(paddingBottom)

    return paddingTopValue + paddingBottomValue
  } catch (error) {
    return 0
  }
}
function getTopPadding(element) {
  try {
    // Get the computed style of the element
    let style = window.getComputedStyle(element)

    // Get individual padding values
    let paddingTop = style.getPropertyValue('padding-top')

    // Parse the values as floats to get numerical values
    let paddingTopValue = parseFloat(paddingTop)

    return paddingTopValue
  } catch (error) {
    return 0
  }
}
function getTopMargin(element) {
  try {
    // Get the computed style of the element
    let style = window.getComputedStyle(element)

    // Get individual padding values
    let paddingTop = style.getPropertyValue('margin-top')

    // Parse the values as floats to get numerical values
    let paddingTopValue = parseFloat(paddingTop)

    return paddingTopValue
  } catch (error) {
    return 0
  }
}
function getBottomPadding(element) {
  try {
    // Get the computed style of the element
    let style = window.getComputedStyle(element)

    // Get individual padding values
    let paddingBottom = style.getPropertyValue('padding-bottom')

    // Parse the values as floats to get numerical values
    let paddingBottomValue = parseFloat(paddingBottom)

    return paddingBottomValue
  } catch (error) {
    return 0
  }
}

function round(num) {
  return Math.round(num * 10) / 10
}

function isWholeNumber(num) {
  return num % 1 === 0
}

function hasDirectText(element) {
  return Array.from(element.childNodes).some(
    node => node.nodeType === Node.TEXT_NODE && node.nodeValue.trim() !== ''
  )
}

function getVisibleHeight(element, container) {
  let style = window.getComputedStyle(element)
  let paddingTop = parseFloat(style.paddingTop)
  let paddingBottom = parseFloat(style.paddingBottom)

  let containerRect = container.getBoundingClientRect()
  let rect = element.getBoundingClientRect()
  let visibleHeight = rect.height

  // Subtract the top padding if the top of the element is visible
  if (rect.top >= 0) {
    visibleHeight -= paddingTop
  }

  // Subtract the bottom padding if the bottom of the element is visible
  if (rect.bottom <= containerRect.height) {
    visibleHeight -= paddingBottom
  }

  // Adjust for partial visibility
  if (rect.top < 0) {
    visibleHeight += Math.min(paddingTop, -rect.top)
  }
  if (rect.bottom > containerRect.height) {
    visibleHeight += Math.min(paddingBottom, rect.bottom - containerRect.height)
  }

  if (rect.top < containerRect.top) {
    visibleHeight -= containerRect.top - rect.top
  }
  if (rect.bottom > containerRect.bottom) {
    visibleHeight -= rect.bottom - containerRect.bottom
  }
  return visibleHeight
}

async function screenLock() {
  // Check if the Wake Lock API is supported
  if ('wakeLock' in navigator) {
    let wakeLock = null

    // Request a screen wake lock
    const requestWakeLock = async () => {
      try {
        wakeLock = await navigator.wakeLock.request('screen')
        console.log('Screen Wake Lock is active')
      } catch (err) {
        //alert(`no sreen lock: ${err}`)
        console.log(err)
      }
    }

    // Call the function to request the wake lock
    await requestWakeLock()
  }
}

async function syncPages(pages) {
  if (navigator.serviceWorker.controller) {
    const cleanPages = []

    pages.forEach(page => {
      if (checkPage(page[1])) cleanPages.push(`${bookPath}\\${page[1]}`)
    })

    navigator.serviceWorker.controller.postMessage({ type: 'fetch', files: cleanPages })
  } else console.log('no service worker')

  function checkPage(file) {
    const result = localStorage.getItem(`${bookPath}\\${file}`)
    return result === null
  }
}

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

function decorate(element) {
  /*try {
    element.style.outline = '2px red dotted'
  } catch (error) {}*/
}
