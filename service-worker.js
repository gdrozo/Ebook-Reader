// Registering the Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    let serviceWorkerPath = '/service-worker.js'
    let scope = './'

    // If the app is running on GitHub Pages, adjust the path and scope
    if (location.hostname === 'gdrozo.github.io') {
      serviceWorkerPath = '/Ebook-Reader/service-worker.js'
      scope = '/Ebook-Reader/'
    }

    navigator.serviceWorker.register(serviceWorkerPath, { scope: scope }).then(
      function (registration) {
        // Registration was successful
        console.log(`ServiceWorker registration successful with scope: ${registration.scope}`)
      },
      function (err) {
        // registration failed :(
        console.log(`ServiceWorker registration failed: ${err}`)
      }
    )
  })
}
