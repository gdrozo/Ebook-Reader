const SERVER_PATH = '/Ebook-Reader'
//const SERVER_PATH = ''

const workerPath = `${SERVER_PATH}/service-worker.js`

function registerServiceWorker() {
  try {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register(workerPath)
          .then(registration => {
            console.log('Service Worker registered with scope:', registration.scope)
            alert('Service Worker registered with scope: ' + registration.scope)
          })
          .catch(error => {
            console.log('Service Worker registration failed:', error)
            alert('Service Worker registration failed: ' + error)
          })
      })
    }
  } catch (error) {
    alert(error)
  }
}

function getSystemInfo() {
  const windowWidth = window.innerWidth
  const windowHeight = window.innerHeight
  // Get the computed font size (which 1rem is based on)
  const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize)

  return { windowWidth, windowHeight, rootFontSize }
}
