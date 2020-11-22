# langterm 🕹️

```
     __ _____________  __  ___
    / //_  __/ __/ _ \/  |/  /   langterm by Ian Langworth, 2017
   / /__/ / / _// , _/ /|_/ /    featuring "The Archive", a cheesy
  /____/_/ /___/_/|_/_/  /_/     interactive fiction game

```

This is a WebGL-based VT220 emulator with a simple fallback for non-JS/non-WebGL/non-desktop browsers. Made as a learning example and frontend for a cute text adventure game. It's also used as my home page on https://langworth.com/. Public domain, use as you wish.

<img src="https://github.com/statico/langterm/blob/master/assets/screenshot.jpg?raw=true" width="250"/>

## How It Works

1. A data structure, Terminal, keeps track of the logical appearance of the
   terminal.

1. The terminal is rendered to a 2048x2048 texture by drawing triangles filled up with bitmap font data found in `assets/apple2font.png`. That font came from [KreativeKorp's Ultimate Apple II Font](http://www.kreativekorp.com/software/fonts/apple2.shtml) and was turned into a sprite sheet with [Codehead’s Bitmap Font Generator](http://www.codehead.co.uk/cbfg/).

1. That texture is rendered to another texture as a full-screen quad (two triangles) and post-processed to add CRT-like scanline and warping effects. I got the CRT shader from [this CRT shader by Timothy Lottes](https://www.shadertoy.com/view/XsjSzR).

1. The background image was from [here](https://goo.gl/AHU79T) and is reused with permission. I photoshopped the text out and noise added to make it look blank. It's rendered to a full-screen quad, and some vignetting and noise is added for effect. I could have used `background-size: cover` in CSS and composited the vignette and noise over the web page, but I wanted to do it all in GLSL as a learning example.

1. The terminal texture is rendered to a 2D quad. I initially used a 3D quad with a persepctive matrix, but the field of view gets stretched with short/wide windows. Using 2D and writing my own aspect ratio math in the shader looks better. Also, I had to enable GL blending to properly composite this texture and its alpha channel over the background image.

1. Text input gets added to a buffer. When you hit Enter, the input buffer is sent to an interactive fiction server running a custom story made with Inform7. See [my gluluxe-httpd project](https://github.com/statico/glulxe-httpd) for the server. The story is closed source, but you can check out a limited public version [here](https://github.com/statico/the-archive-public). The whole idea is that you'll have to figure it out on your own ;)

I started with WebGL Boilerplate (github.com/paulirish/webgl-boilerplate). For more involved projects and to reduce repetition, I would consider using ThreeJS.

## Build/Test

1. [Get a Glulx game](https://github.com/statico/glulxe-httpd#get-started) and run [statico/glulxe-httpd](https://github.com/statico/glulxe-httpd)
2. Serve this directory with something like `python -m SimpleHTTPServer` and go to http://localhost:8000

## Credits

- [Apple II font](http://www.kreativekorp.com/software/fonts/apple2.shtml) from KreativeKorp
- [Codehead’s Bitmap Font Generator](http://www.codehead.co.uk/cbfg/)
- [CRT styled scanline shader](https://www.shadertoy.com/view/XsjSzR) by Timothy Lottes
- [Original VT520 photo](https://goo.gl/AHU79T) by Ratko Grbic (modified by me to remove text)
- [Inform7](http://inform7.com/) was used to create the story
- [ifhttp](https://github.com/statico/ifhttp) runs the story
- [WebGL Boilerplate](https://github.com/paulirish/webgl-boilerplate)
