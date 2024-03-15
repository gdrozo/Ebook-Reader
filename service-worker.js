// Registering the Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/service-worker.js').then(
      function (registration) {
        // Registration was successful
        alert(`ServiceWorker registration successful with scope: ${registration.scope}`)
      },
      function (err) {
        // registration failed :(
        alert(`ServiceWorker registration failed: ${err}`)
      }
    )
  })
}

// Web App Manifest
// Place this link tag in the head of your HTML
//
