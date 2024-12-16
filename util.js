const SERVER_PATH = '/Ebook-Reader'

function getSystemInfo() {
  const windowWidth = window.innerWidth
  const windowHeight = window.innerHeight
  // Get the computed font size (which 1rem is based on)
  const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize)

  return { windowWidth, windowHeight, rootFontSize }
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
