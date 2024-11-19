document.getElementById('configButton').onclick = e => {
  const element = `
  <div id="config" class="fixed top-0 bottom-0 left-0 backdrop-blur-sm bg-black/30 overflow-hidden z-0 w-[min(20rem,100dvw)] left-hidden
   menu">
    <button
          class="absolute left-11 top-7 opacity-50 hover:opacity-100 hover:scale-110 transition-all duration-300"
          id="configClose"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="size-6 text-inherit"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M6 18 18 6M6 6l12 12"
              class="text-inherit"
            />
          </svg>
        </button>
  </div>`

  const additionalScreen = document.getElementById('menu')

  const div = document.createElement('div')

  additionalScreen.appendChild(div)
  div.outerHTML = element

  document.getElementById('config').classList.remove('left-hidden')
  document.getElementById('config').classList.add('open-to-right')

  document.getElementById('configClose').onclick = e => {
    document.getElementById('config').classList.remove('open-to-right')
    document.getElementById('config').classList.add('close-to-left')
  }
}
