//
// Simple mode of the game -- just a scrollable text box and an input field.
//
const simpleView = (() => {
  const $ = document.body.querySelector.bind(document.body)

  // Add a string from the server to the output.
  const renderOutput = (output) => {
    const main = $("main")

    // Remove trailing prompt character.
    const text = output.replace(/>$/s, "").trim()

    // If there's a header, make it inverted.
    const re = /^([A-Z ]+)(\n+)/s
    const match = text.match(re)
    if (match) {
      main.innerHTML += `<div class="heading">${match[1]}</div>`
    }

    const el = document.createElement("div")
    el.innerText = text.replace(re, "") + "\n\n"
    main.appendChild(el)
    main.scrollTop = main.scrollHeight
  }

  const setup = async () => {
    document.body.className = "simple"
    document.body.innerHTML = `
      <main></main>
      <form>
        <input type="text" autofocus tabindex="0" />
        <button tabindex="0">Enter</button>
      </form>
    `

    $("main").innerHTML = `<pre>   __ _____________  __  ___                 
  / //_  __/ __/ _ \\/  |/  /
 / /__/ / / _// , _/ /|_/ /
/____/_/ /___/_/|_/_/  /_/

28.8 kbit/s ][ 
ver 2020.08.26.1
617-555-1337    
                                                   
Username: ian                                  
Password: **********</pre>`

    $("input").focus()

    $("form").addEventListener("submit", async (event) => {
      event.preventDefault()

      const input = $("input")
      const message = input.value
      input.value = ""
      input.focus()

      const el = document.createElement("div")
      el.className = "input"
      el.innerText = "> " + message.replace(/[^\w ]/g, "") + "\n\n"

      const main = $("main")
      main.appendChild(el)
      main.scrollTop = main.scrollHeight

      renderOutput(await api.send(message))
    })

    try {
      renderOutput(await api.setup())
    } catch (err) {
      const ua = navigator.userAgent
      renderOutput(`?ERROR? ${err}\n\nPlease tell Ian.\n\n${ua}`)
      console.error(err)
    }
  }

  const teardown = () => {
    document.body.innerHTML = ""
  }

  return { setup, teardown }
})()
