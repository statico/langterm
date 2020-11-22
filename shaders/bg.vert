// Background vertex shader. Nothing special.

attribute vec3 aPosition;
attribute vec2 aTexCoord;
varying vec2 vTexCoord;

void main() {
  gl_Position = vec4(aPosition, 1.0);
  vTexCoord = aTexCoord;
}