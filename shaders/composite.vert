// Compositing vertex shader. Nothing special other than that we're now doing 3D.

uniform mediump vec2 uScreenSize;
uniform mediump vec2 uBGSize;
attribute vec3 aPosition;
attribute vec2 aTexCoord;
varying vec2 vTexCoord;

void main() {

  // Place the terminal texture over the background to align up with the
  // background-size: cover emulation we do in the background shader.
  vec3 pos = aPosition;
  vec2 s = uScreenSize; // Screen
  vec2 i = uBGSize; // Image
  float rs = s.x / s.y;
  float ri = i.x / i.y;
  if (rs < ri) {
    pos.x /= rs;
  } else {
    pos.x /= ri;
    pos.y *= 1.0 + ((rs - ri) / 2.0); // Not perfect but good enough.
  }

  gl_Position = vec4(pos, 1.0);
  vTexCoord = aTexCoord;
}
