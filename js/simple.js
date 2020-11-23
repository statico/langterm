const simpleView = (() => {
  const $ = document.body.querySelector.bind(document.body)

  const renderOutput = (output) => {
    const main = $('main')

    // Remove trailing prompt character.
    const text = output.replace(/>$/s, '').trim()

    // If there's a header, make it inverted.
    const re = /^([A-Z ]+)(\n+)/s
    const match = text.match(re)
    if (match) {
      main.innerHTML += `<div class="heading">${match[1]}</div>`
    }

    const el = document.createElement('div')
    el.innerText = text.replace(re, '') + '\n\n'
    main.appendChild(el)
    main.scrollTop = main.scrollHeight
  }

  const setup = async () => {
    document.body.className = 'simple'
    document.body.innerHTML = `
      <main></main>
      <form>
        <input type="text" autofocus />
        <button>Enter</button>
      </form>
    `

    $('form').addEventListener('submit', async (event) => {
      event.preventDefault()

      const input = $('input')
      const message = input.value
      input.value = ''
      input.focus()

      const el = document.createElement('div')
      el.className = 'input'
      el.innerText = '> ' + message.replace(/[^\w ]/g, '') + '\n\n'

      const main = $('main')
      main.appendChild(el)
      main.scrollTop = main.scrollHeight

      renderOutput(await api.send(message))
    })

    try {
      renderOutput(await api.setup())
    } catch (err) {
      renderOutput('?ERROR? ' + err + '\n\nPlease tell Ian.')
    }
  }

  const teardown = () => {}

  return { setup, teardown }
})()
