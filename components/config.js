let textSize = localStorage.getItem('textSize')

if (!textSize) {
  textSize = 16
  localStorage.setItem('textSize', textSize)
}

document.getElementById('configButton').onclick = e => {
  const element = `
  <div id="config" class="fixed top-0 bottom-0 left-0 backdrop-blur-sm bg-black/30 overflow-hidden z-0 w-[min(20rem,100dvw)] left-hidden
   menu">
    <button
        class="absolute left-11 top-7 opacity-50 hover:opacity-100 hover:scale-110 transition-all duration-300"
        id="configClose"
    >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6 text-inherit">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"class="text-inherit" />
        </svg>

    </button>
    <div
        id="index"
        class="absolute top-20 left-12 flex flex-col gap-3 right-5 items-stretch bottom-0 overflow-x-hidden overflow-y-scroll"
    >
        <div id="" class="font-bold text-2xl pb-3">Configuration</div>
        <div class="grid grid-cols-[35%_65%] w-full">
          <div class="flex justify-center items-center">
            <label class="text-center" for="textSize">Text Size</label>
          </div>
            
          <div class="flex rounded-md bg-[#181a1b] h-8 ">
              
              <button id="textSizeMinus" class="flex justify-center items-center w-14 hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6 text-inherit">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14" class="text-inherit" />
                  </svg>
              </button>
              <input class="px-1 bg-transparent min-w-0 w-[calc(100%-3.5rem*2)] text-center" type="number" min="1"  value="${textSize}" pattern="\d+" name="textSize" id="textSize">

              <button id="textSizePlus" class="flex w-14 justify-center items-center hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6 text-inherit">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"  class="text-inherit" />
                  </svg>
              </button>
          </div>
        </div>
    </div>
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

  document.getElementById('textSize').oninput = e => {
    //check if number and integer
    if (isNaN(e.target.value) || e.target.value % 1 !== 0) {
      document.getElementById('textSize').value = textSize
      return
    }

    textSize = e.target.value
    localStorage.setItem('textSize', e.target.value)
    window.rendition.themes.fontSize(textSize + 'px')
  }

  document.getElementById('textSizeMinus').onclick = e => {
    if (textSize <= 1) return
    textSize--
    document.getElementById('textSize').value = textSize
    localStorage.setItem('textSize', textSize)
    window.rendition.themes.fontSize(textSize + 'px')
  }

  document.getElementById('textSizePlus').onclick = e => {
    if (textSize >= 100) return
    textSize++
    document.getElementById('textSize').value = textSize
    localStorage.setItem('textSize', textSize)
    window.rendition.themes.fontSize(textSize + 'px')
  }
}
