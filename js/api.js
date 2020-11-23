const api = (() => {
  // Expect statico/glulxe-httpd to be running when testing on localhost.
  const ENDPOINT = /langworth\.com/.test(document.location.hostname)
    ? 'https://game.langworth.com'
    : `http://${document.location.hostname}:5000`

  let sessionID

  const createSession = async () => {
    const res = await fetch(ENDPOINT + '/new', { method: 'POST' })
    const data = await res.json()
    sessionID = data.session
    sessionStorage.setItem('sessionID', sessionID)
    return data.output
  }

  const send = async (message) => {
    try {
      const res = await fetch(ENDPOINT + '/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session: sessionID, message: message }),
      })
      const data = await res.json()

      var match = String(data.output).match(/OPENURL:(\S+)/)
      if (match) {
        document.location.href = match[1]
      } else {
        return data.output
      }
    } catch (err) {
      if (/No such session/.test(err)) {
        return start()
      } else {
        throw err
      }
    }
  }

  const setup = async () => {
    // Use `?new` to force a new session.
    if (document.location.search.substr(1) === 'new') sessionStorage.clear()

    sessionID = sessionStorage.getItem('sessionID')
    if (sessionID) {
      return await send('look')
    } else {
      return await createSession()
    }
  }

  return { setup, send }
})()
