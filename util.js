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
  var words = str.split(' ') // Split the string into an array of words
  words.pop() // Remove the last word
  var newStr = words.join(' ') // Join the array back into a string
  element.innerHTML = newStr
  return newStr
}

function remToPx(rem) {
  return rem * parseFloat(getComputedStyle(document.documentElement).fontSize)
}
