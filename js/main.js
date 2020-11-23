const originalBody = document.body.innerHTML
let mode = 'original'

const goOriginal = () => {
  mode = 'original'
  document.body.innerHTML = originalBody
  try {
    simpleView.teardown()
    fancyView.teardown()
  } catch (err) {
    // Do nothing.
  }
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

window.addEventListener('error', () => {
  window.removeEventListener('resize', updateViewDebounced)
  goOriginal()
})
