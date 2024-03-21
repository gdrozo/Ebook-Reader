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

function getPaddingAndMargin(element) {
  try {
    // Get the computed style of the element
    let style = window.getComputedStyle(element)

    // Get individual padding values
    let paddingTop = style.getPropertyValue('padding-top')
    let paddingBottom = style.getPropertyValue('padding-bottom')

    // Get individual margin values
    let marginTop = style.getPropertyValue('margin-top')
    let marginBottom = style.getPropertyValue('margin-bottom')

    // Parse the values as floats to get numerical values
    let paddingTopValue = parseFloat(paddingTop)
    let paddingBottomValue = parseFloat(paddingBottom)

    let marginTopValue = parseFloat(marginTop)
    let marginBottomValue = parseFloat(marginBottom)

    return paddingTopValue + paddingBottomValue + marginTopValue + marginBottomValue
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
