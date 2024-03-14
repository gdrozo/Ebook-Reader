const pin = '1346'
let typePin = ''
const secured = localStorage.getItem('secured')
if (secured === null || secured === 'false') {
  document.getElementById('security').parentElement.style.display = 'block'

  const numPad = document.getElementById('numPad')
  ;[...numPad.children].forEach(button => {
    button.onclick = numberClick
  })
}

function numberClick(e) {
  const text = e.target.innerText

  if (text === 'OK') return
  if (text === undefined) {
    if (pass.innerText.length > 4 || pass.innerText.length < 1) return
    pass.innerText = pass.innerText.slice(0, -1)
    typePin = typePin.slice(0, -1)
    if (pass.innerText === '') pass.innerText = 'Use the pin to enter'
    return
  }

  if (pass.innerText.length > 4) pass.innerText = ''
  let previousPass = pass.innerText
  if (previousPass.length === 4) return
  const number = parseInt(text)

  typePin = `${typePin}${number}`
  pass.innerText = `${previousPass}${number}`

  if (pass.innerText.length === 4) {
    if (typePin === pin) {
      localStorage.setItem('secured', 'true')
      document.getElementById('security').parentElement.style.display = 'none'
    }
  }

  const index = pass.innerText.length - 1
  setTimeout(() => {
    const textArray = pass.innerText.split('')
    let start = textArray.slice(0, index)
    start = start === '' ? '' : start.join('')
    let num = textArray.slice(index, index + 1)
    let end = textArray.slice(index + 1)
    end = end === '' ? '' : end.join('')

    pass.innerText = `${start}-${end}`
  }, 500)
}
