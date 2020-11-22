var term = new Terminal()
term.addString(
  `     __ _____________  __  ___                 
        / //_  __/ __/ _ \\/  |/  / 28.8 kbit/s ][ 
       / /__/ / / _// , _/ /|_/ /  ver 2020.02.16.3
      /____/_/ /___/_/|_/_/  /_/   617-555-1337    
                                                   
    Username: ian                                  
    Password: **********                          
  `
)

// Uncomment to fill the terminal with #'s for positioning.
// term.clear(); for (var i = 0; i < term.width * term.height - 1; i++) term.addChar('#');
;(function () {
  // const ENDPOINT = 'https://game.langworth.com'
  const ENDPOINT = 'https://localhost:5000'

  function update() {
    if (!gl) return
    gl.bindBuffer(gl.ARRAY_BUFFER, termGeoBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, term.getGeoBuffer(), gl.STATIC_DRAW)
    gl.bindBuffer(gl.ARRAY_BUFFER, termCharBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, term.getCharBuffer(), gl.STATIC_DRAW)
  }

  if (document.location.search.substr(1) === 'new') sessionStorage.clear()

  const sessionID = sessionStorage.getItem('sessionID')
  let inputBuffer = ''

  if (!sessionID) {
    term.addString('logging in.....')
    createSession()
  } else {
    term.addString('restoring session.....\n')
    sendCommand('look')
  }

  function jsonXHR(url, body, cb) {
    const req = new XMLHttpRequest()
    req.open(body ? 'POST' : 'GET', url, true)
    if (body) req.setRequestHeader('content-type', 'application/json')
    req.onload = function () {
      let obj
      try {
        obj = JSON.parse(req.responseText)
      } catch (e) {
        return cb(req.statusText)
      }
      if (obj.error) return cb(obj.error)
      if (req.status >= 200 && req.status < 400) {
        cb(null, obj)
      } else {
        cb(req.statusText)
      }
    }
    req.onerror = function () {
      cb('Request to ' + url + ' failed: ' + req.statusText)
    }
    req.send(body ? JSON.stringify(body) : undefined)
  }

  function createSession() {
    const timer = setInterval(function () {
      term.addChar('.')
      update()
    }, 250)

    jsonXHR(ENDPOINT + '/new', null, function (err, data) {
      clearTimeout(timer)
      sessionID = data.session
      sessionStorage.setItem('sessionID', sessionID)
      term.addString('\n\n')
      term.addString(data.output, true)
      update()
    })
  }

  function sendCommand(message) {
    jsonXHR(
      ENDPOINT + '/send',
      { session: sessionID, message: message },
      function (err, data) {
        if (err) {
          if (/No such session/.test(err)) {
            createSession()
          } else {
            term.addString('?ERROR? ' + err + '\n', true)
          }
          update()
        } else {
          var match = String(data.output).match(/OPENURL:(\S+)/)
          if (match) {
            document.location.href = match[1]
          } else {
            term.addChar('\n')
            term.addString(data.output, true)
            update()
          }
        }
      }
    )
  }

  window.addEventListener('keydown', function (e) {
    if (e.keyCode === 13) {
      // Enter key
      term.addChar('\n')
      const message = inputBuffer
      inputBuffer = ''
      sendCommand(message)
    } else if (e.keyCode === 8) {
      // Backspace
      e.preventDefault() // Otherwise Backspace navigates back on Firefox.
      term.backspace()
      inputBuffer = inputBuffer.slice(0, -1)
    } else if (e.keyCode === 33) {
      // Page Up
      e.preventDefault()
      term.pageUp()
    } else if (e.keyCode === 34) {
      // Page Down
      e.preventDefault()
      term.pageDown()
    } else if (e.keyCode === 35) {
      // End
      e.preventDefault()
      term.end()
    } else if (e.key.length === 1) {
      // Modifier keys have long names.
      if (e.ctrlKey && e.key === 'l') {
        term.clear()
        term.addChar('>')
      } else {
        term.addChar(e.key)
        inputBuffer += e.key
      }
    } else return
    update()
  })
  window.focus()
})()

// A giant pile of global variables that I'm too lazy to refactor. Sorry.
let canvas,
  gl,
  bgImageTex,
  bgImageTexLocation,
  bgPositionBuffer,
  bgPositionLocation,
  bgProgram,
  bgScreenSizeLocation,
  bgSizeLocation,
  bgTexCoordBuffer,
  bgTexCoordLocation,
  bgTimeLocation,
  compBGSizeLocation,
  compPositionBuffer,
  compPositionLocation,
  compPostTexLocation,
  compProgram,
  compScreenSizeLocation,
  compTexCoordBuffer,
  compTexCoordLocation,
  postFrameBuf,
  postPositionBuffer,
  postPositionLocation,
  postProgram,
  postTermTexLocation,
  postTex,
  postTexCoordBuffer,
  postTexCoordLocation,
  termCharBuffer,
  termCharLocation,
  termFontTex,
  termFontTexLocation,
  termFrameBuf,
  termGeoBuffer,
  termGeoLocation,
  termGridSizeLocation,
  termProgram,
  termScreenSizeLocation,
  termTex,
  termTimeLocation,
  parameters = {
    startTime: Date.now(),
    time: 0,
    screenWidth: 0,
    screenHeight: 0,
    gridWidth: term.width,
    gridHeight: term.height,
  }

// We only have a few things to load, so start everything up after they're done loading.
const fontImage = new Image()
fontImage.src = 'apple2font.png'
const bgImage = new Image()
bgImage.src = 'term.jpg'
const barrier = 0
bgImage.onload = fontImage.onload = () => {
  barrier++
  if (barrier === 2) {
    init()
    resize()
    animate()
  }
}

const init = () => {
  window.onresize = resize

  const UNIT_QUAD_GEO = new Float32Array([
    1.0,
    1.0,
    0.0,
    -1.0,
    1.0,
    0.0,
    1.0,
    -1.0,
    0.0,
    -1.0,
    -1.0,
    0.0,
  ])
  const UNIT_QUAT_COORDS = new Float32Array([1, 1, 0, 1, 1, 0, 0, 0])

  let vs, fs
  canvas = document.querySelector('canvas')
  const content = document.querySelector('#content')

  try {
    gl = canvas.getContext('experimental-webgl', { alpha: false })
  } catch (error) {}
  if (!gl) {
    console.error('Cannot create WebGL context.')
    content.style.display = 'block'
    canvas.style.display = 'none'
    return
  }

  if (document.body.clientWidth <= 768) {
    gl = null
    content.style.display = 'block'
    canvas.style.display = 'none'
    return
  }

  document.querySelector('#content').style.display = 'none'

  gl.disable(gl.DEPTH_TEST)
  gl.enable(gl.BLEND) // Needed for the composition shader.
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

  // Terminal shader
  vs = document.getElementById('term-vs').textContent
  fs = document.getElementById('term-fs').textContent
  termProgram = createProgram(vs, fs)
  termTimeLocation = gl.getUniformLocation(termProgram, 'uTime')
  termScreenSizeLocation = gl.getUniformLocation(termProgram, 'uScreenSize')
  termGridSizeLocation = gl.getUniformLocation(termProgram, 'uGridSize')
  termFontTexLocation = gl.getUniformLocation(termProgram, 'uFont')
  termGeoLocation = gl.getAttribLocation(termProgram, 'aGeo')
  termCharLocation = gl.getAttribLocation(termProgram, 'aChar')

  // Terminal gemoetry buffer
  termGeoBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, termGeoBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, term.getGeoBuffer(), gl.STATIC_DRAW)
  gl.bindBuffer(gl.ARRAY_BUFFER, null)

  // Terminal character buffer
  termCharBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, termCharBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, term.getCharBuffer(), gl.STATIC_DRAW)
  gl.bindBuffer(gl.ARRAY_BUFFER, null)

  // Terminal font image
  termFontTex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, termFontTex)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, fontImage)
  gl.bindTexture(gl.TEXTURE_2D, null)

  // Terminal framebuffer & texture
  termFrameBuf = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, termFrameBuf)
  termTex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, termTex)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    gl.LINEAR_MIPMAP_NEAREST
  )
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    2048,
    2048,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null
  )
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    termTex,
    0
  )
  gl.bindTexture(gl.TEXTURE_2D, null)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)

  // Post-process shader
  vs = document.getElementById('post-vs').textContent
  fs = document.getElementById('post-fs').textContent
  postProgram = createProgram(vs, fs)
  postTermTexLocation = gl.getUniformLocation(postProgram, 'uTermTex')
  postPositionLocation = gl.getAttribLocation(postProgram, 'aPosition')
  postTexCoordLocation = gl.getAttribLocation(postProgram, 'aTexCoord')

  // Post-process geometry buffer
  postPositionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, postPositionBuffer)
  const geo = new Float32Array([
    0.94,
    0.66,
    1, // TR
    -0.76,
    0.66,
    1, // TL
    0.94,
    -0.57,
    1, // BR
    -0.72,
    -0.65,
    1, // BL
  ])
  gl.bufferData(gl.ARRAY_BUFFER, geo, gl.STATIC_DRAW)
  gl.bindBuffer(gl.ARRAY_BUFFER, null)

  // Post-process texture coordinate buffer
  postTexCoordBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, postTexCoordBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, UNIT_QUAT_COORDS, gl.STATIC_DRAW)
  gl.bindBuffer(gl.ARRAY_BUFFER, null)

  // Post-process framebuffer & texture
  postFrameBuf = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, postFrameBuf)
  postTex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, postTex)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    gl.LINEAR_MIPMAP_NEAREST
  )
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    2048,
    2048,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null
  )
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    postTex,
    0
  )
  gl.bindTexture(gl.TEXTURE_2D, null)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)

  // Background shader
  vs = document.getElementById('bg-vs').textContent
  fs = document.getElementById('bg-fs').textContent
  bgProgram = createProgram(vs, fs)
  bgImageTexLocation = gl.getUniformLocation(bgProgram, 'uBGImageTex')
  bgScreenSizeLocation = gl.getUniformLocation(bgProgram, 'uScreenSize')
  bgTimeLocation = gl.getUniformLocation(bgProgram, 'uTime')
  bgSizeLocation = gl.getUniformLocation(bgProgram, 'uBGSize')
  bgPositionLocation = gl.getAttribLocation(bgProgram, 'aPosition')
  bgTexCoordLocation = gl.getAttribLocation(bgProgram, 'aTexCoord')

  // Background image
  bgImageTex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, bgImageTex)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bgImage)
  gl.bindTexture(gl.TEXTURE_2D, null)

  // Background geometry buffer
  bgPositionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, bgPositionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, UNIT_QUAD_GEO, gl.STATIC_DRAW)
  gl.bindBuffer(gl.ARRAY_BUFFER, null)

  // Background texture coordinate buffer
  bgTexCoordBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, bgTexCoordBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, UNIT_QUAT_COORDS, gl.STATIC_DRAW)
  gl.bindBuffer(gl.ARRAY_BUFFER, null)

  // Composition shader
  vs = document.getElementById('comp-vs').textContent
  fs = document.getElementById('comp-fs').textContent
  compProgram = createProgram(vs, fs)
  compPostTexLocation = gl.getUniformLocation(compProgram, 'uPostTex')
  compScreenSizeLocation = gl.getUniformLocation(compProgram, 'uScreenSize')
  compBGSizeLocation = gl.getUniformLocation(compProgram, 'uBGSize')
  compPositionLocation = gl.getAttribLocation(compProgram, 'aPosition')
  compTexCoordLocation = gl.getAttribLocation(compProgram, 'aTexCoord')

  // Composition geometry buffer
  compPositionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, compPositionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, UNIT_QUAD_GEO, gl.STATIC_DRAW)
  gl.bindBuffer(gl.ARRAY_BUFFER, null)

  // Composition texture coordinate buffer
  compTexCoordBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, compTexCoordBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, UNIT_QUAT_COORDS, gl.STATIC_DRAW)
  gl.bindBuffer(gl.ARRAY_BUFFER, null)
}

function createProgram(vertex, fragment) {
  const program = gl.createProgram()
  const preamble = '#ifdef GL_ES\nprecision mediump float;\n#endif\n\n'
  const vs = createShader(preamble + vertex, gl.VERTEX_SHADER)
  const fs = createShader(preamble + fragment, gl.FRAGMENT_SHADER)

  if (vs == null || fs == null)
    throw new Error('Either vertex or fragment shader is null')
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.deleteShader(vs)
  gl.deleteShader(fs)
  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(
      'ERROR:\n' +
        'VALIDATE_STATUS: ' +
        gl.getProgramParameter(program, gl.VALIDATE_STATUS) +
        '\n' +
        'ERROR: ' +
        gl.getError() +
        '\n' +
        'LOG: ' +
        gl.getProgramInfoLog(program) +
        '\n\n' +
        '- Vertex Shader -\n' +
        vertex +
        '\n\n' +
        '- Fragment Shader -\n' +
        fragment
    )
  }

  return program
}

function createShader(src, type) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, src)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(
      (type === gl.VERTEX_SHADER ? 'VERTEX' : 'FRAGMENT') +
        ' SHADER:\n' +
        gl.getShaderInfoLog(shader)
    )
  }
  return shader
}

function resize() {
  if (!gl) return
  var r = window.devicePixelRatio || 1
  var w = Math.floor(gl.canvas.clientWidth * r)
  var h = Math.floor(gl.canvas.clientHeight * r)
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = parameters.screenWidth = w
    canvas.height = parameters.screenHeight = h
  }
}

// Limit FPS to 15 to avoid melting GPUs.
let lastFrame = 0
function animate() {
  const now = Date.now()
  if (now - 1000 / 15 > lastFrame) {
    lastFrame = now
    render()
  }
  requestAnimationFrame(animate)
}

const render = () => {
  if (!termProgram) return

  // Draw the terminal

  parameters.time = Date.now() - parameters.startTime

  gl.bindFramebuffer(gl.FRAMEBUFFER, termFrameBuf)
  gl.viewport(0, 0, 2048, 2048)
  gl.clear(gl.COLOR_BUFFER_BIT)

  gl.useProgram(termProgram)
  gl.uniform1f(termTimeLocation, parameters.time / 1000)
  gl.uniform2f(
    termScreenSizeLocation,
    parameters.screenWidth,
    parameters.screenHeight
  )
  gl.uniform2f(
    termGridSizeLocation,
    parameters.gridWidth,
    parameters.gridHeight
  )

  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, termFontTex)
  gl.uniform1i(termFontTexLocation, 0)

  gl.bindBuffer(gl.ARRAY_BUFFER, termGeoBuffer)
  gl.vertexAttribPointer(termGeoLocation, 2, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(termGeoLocation)

  gl.bindBuffer(gl.ARRAY_BUFFER, termCharBuffer)
  gl.vertexAttribPointer(termCharLocation, 2, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(termCharLocation)

  gl.drawArrays(gl.TRIANGLES, 0, term.buffer.length * 3)

  gl.disableVertexAttribArray(termGeoLocation)
  gl.disableVertexAttribArray(termCharLocation)

  gl.bindTexture(gl.TEXTURE_2D, termTex)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE) // Prevent artifacts
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE) // Prevent artifacts
  gl.generateMipmap(gl.TEXTURE_2D)
  gl.bindTexture(gl.TEXTURE_2D, null)

  // Post-process the terminal

  gl.bindFramebuffer(gl.FRAMEBUFFER, postFrameBuf)
  gl.viewport(0, 0, 2048, 2048)
  gl.clear(gl.COLOR_BUFFER_BIT)

  gl.useProgram(postProgram)

  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, termTex)
  gl.uniform1i(postTermTexLocation, 0)

  gl.bindBuffer(gl.ARRAY_BUFFER, postPositionBuffer)
  gl.vertexAttribPointer(postPositionLocation, 3, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(postPositionLocation)

  gl.bindBuffer(gl.ARRAY_BUFFER, postTexCoordBuffer)
  gl.vertexAttribPointer(postTexCoordLocation, 2, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(postTexCoordLocation)

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

  gl.bindTexture(gl.TEXTURE_2D, postTex)
  gl.generateMipmap(gl.TEXTURE_2D)
  gl.bindTexture(gl.TEXTURE_2D, null)

  gl.disableVertexAttribArray(postPositionLocation)
  gl.disableVertexAttribArray(postTexCoordLocation)

  // Draw the background

  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  gl.viewport(0, 0, canvas.width, canvas.height)
  gl.clear(gl.COLOR_BUFFER_BIT)

  gl.useProgram(bgProgram)
  gl.uniform1f(bgTimeLocation, parameters.time / 1000)
  gl.uniform2f(
    bgScreenSizeLocation,
    parameters.screenWidth,
    parameters.screenHeight
  )
  gl.uniform2f(bgSizeLocation, bgImage.width, bgImage.height)

  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, bgImageTex)
  gl.uniform1i(bgImageTexLocation, 0)

  gl.bindBuffer(gl.ARRAY_BUFFER, bgPositionBuffer)
  gl.vertexAttribPointer(bgPositionLocation, 3, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(bgPositionLocation)

  gl.bindBuffer(gl.ARRAY_BUFFER, bgTexCoordBuffer)
  gl.vertexAttribPointer(bgTexCoordLocation, 2, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(bgTexCoordLocation)

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

  gl.disableVertexAttribArray(bgPositionLocation)
  gl.disableVertexAttribArray(bgTexCoordLocation)

  // Composite the terminal

  gl.useProgram(compProgram)
  gl.uniform2f(
    compScreenSizeLocation,
    parameters.screenWidth,
    parameters.screenHeight
  )
  gl.uniform2f(compBGSizeLocation, bgImage.width, bgImage.height)

  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, postTex)
  gl.uniform1i(compPostTexLocation, 0)

  gl.bindBuffer(gl.ARRAY_BUFFER, compPositionBuffer)
  gl.vertexAttribPointer(compPositionLocation, 3, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(compPositionLocation)

  gl.bindBuffer(gl.ARRAY_BUFFER, compTexCoordBuffer)
  gl.vertexAttribPointer(compTexCoordLocation, 2, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(compTexCoordLocation)

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

  gl.disableVertexAttribArray(compPositionLocation)
  gl.disableVertexAttribArray(compTexCoordLocation)
}
