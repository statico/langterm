const originalBody = document.querySelector('.content').innerHTML
let mode = 'original'

const goOriginal = () => {
  try {
    simpleView.teardown()
    fancyView.teardown()
  } catch (err) {
    // Do nothing.
  }
  mode = 'original'
  document.body.className = 'original'
  document.body.innerHTML = originalBody
}

const goFancy = () => {
  if (mode !== 'fancy') {
    simpleView.teardown()
    fancyView.setup()
    mode = 'fancy'
  }
}

const goSimple = () => {
  if (mode !== 'simple') {
    fancyView.teardown()
    simpleView.setup()
    mode = 'simple'
  }
}

window.addEventListener('error', goOriginal)

const updateView = () => {
  if (document.body.clientWidth > 768) {
    goFancy()
  } else {
    goSimple()
  }
}

const updateViewDebounced = (() => {
  let timer
  return () => {
    clearTimeout(timer)
    timer = setTimeout(updateView, 300)
  }
})()

window.addEventListener('resize', updateViewDebounced)
window.addEventListener('load', updateView)

window.addEventListener('touchstart', () => {
  window.removeEventListener('resize', updateViewDebounced)
  goSimple()
})

window.addEventListener('error', (err) => {
  window.removeEventListener('resize', updateViewDebounced)
  goOriginal()
  document.body.innerHTML += `<p>${err}</p>`
})
