// Compositing vertex shader. Nothing special.

uniform mediump vec2 uScreenSize;
uniform sampler2D uPostTex;
varying mediump vec2 vTexCoord;
uniform float uDegauss;

// BEGIN DEGAUSS CODE -------------------------------------------------------------
// From https://www.shadertoy.com/view/cdtSD8

// Shader written by ChatGPT (OpenAI) for demonstration purposes only.
// This code is provided as-is without any warranty or guarantee of fitness for any purpose.
// You may use, modify, and redistribute this code without permission or attribution.
// This code is released into the public domain.

void degauss(out vec4 fragColor, in vec2 fragCoord) {
  vec2 iResolution = uScreenSize;
  vec2 uv = vTexCoord;
  vec4 color = texture2D(uPostTex, uv);
  float i = uDegauss * 0.04; // adjust this coefficient to control the speed of the animation
  float angle = length(fragCoord.xy - iResolution.xy / 2.0) / 200.0;
  float s = sin(angle);
  float c = cos(angle);
  mat2 m = mat2(c, -s, s, c);

  float degaussStrength = 0.0;
  if(i < 1.0) {
    float t = i;
    for(int j = 0; j < 7; j++) {
      t = 1.0 - abs(1.0 - t) * abs(1.0 - t);
    }
    degaussStrength = mix(1.0, 0.0, t);
  }

  vec2 offset = vec2(2.0, 0.0) * degaussStrength; // adjust this value for the desired strength
  fragColor = texture2D(uPostTex, uv + offset * m);
}

// END DEGAUSS CODE -------------------------------------------------------------

void main() {
  // Trim to the screen size. So I really should be rendering the terminal to
  // the entire texture size and doing this using the post-processing position
  // buffer, but I'm low on time. Sorry!
  if (vTexCoord.x < 0.11) discard;
  if (vTexCoord.x > 0.99) discard;
  if (vTexCoord.y < vTexCoord.x * 0.06 + 0.15) discard;
  if (vTexCoord.y > 0.84) discard;

  gl_FragColor = texture2D(uPostTex, vTexCoord);

  // The fancy CRT shader works against a black background and the alpha channel
  // is lost. Using the red value as alpha looks good enough.
  gl_FragColor.a = gl_FragColor.r;

  // Add the degauss effect
  degauss(gl_FragColor, gl_FragCoord.xy);

  // Uncomment to show a white border, which helps with positioning:
  // if (vTexCoord.x < 0.005 || vTexCoord.x > 0.995 || vTexCoord.y < 0.005 || vTexCoord.y > 0.995) gl_FragColor += 0.5;
}
