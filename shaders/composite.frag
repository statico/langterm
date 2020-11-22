// Compositing vertex shader. Nothing special.

uniform mediump vec2 uScreenSize;
uniform sampler2D uPostTex;
varying mediump vec2 vTexCoord;

void main() {
  gl_FragColor = texture2D(uPostTex, vTexCoord);

  // The fancy CRT shader works against a black background and the alpha channel is lost. Using the
  // red value as alpha looks good enough.
  gl_FragColor.a = gl_FragColor.r;

  // Uncomment to show a white border, which helps with positioning:
  //if (vTexCoord.x < 0.005 || vTexCoord.x > 0.995 || vTexCoord.y < 0.005 || vTexCoord.y > 0.995) gl_FragColor += 0.5;
}
