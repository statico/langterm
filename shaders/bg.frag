// Background fragment shader. Centers the background image in a quad and adds effects.

uniform sampler2D uBGImageTex;
uniform vec2 uScreenSize;
uniform vec2 uBGSize;
uniform float uTime;
varying mediump vec2 vTexCoord;

// https://github.com/Jam3/glsl-blend-overlay
vec3 blend(vec3 base, vec3 value) {
  return mix(1.0 - 2.0 * (1.0 - base) * (1.0 - value), 2.0 * base * value, step(base, vec3(0.5)));
}

// https://github.com/mattdesl/glsl-random
float random(vec2 co) {
  highp float a = 12.9898;
  highp float b = 78.233 - uTime;
  highp float c = 43758.5453 + uTime;
  highp float dt = dot(co.xy, vec2(a,b));
  highp float sn = mod(dt, 3.14);
  return fract(sin(sn) * c);
}

void main() {
  // An implementation of CSS `background-size: cover`
  // using http://stackoverflow.com/a/6565988 and my own crappy math
  vec2 s = uScreenSize; // Screen
  vec2 i = uBGSize; // Image
  float rs = s.x / s.y;
  float ri = i.x / i.y;
  vec2 new = rs < ri ? vec2(i.x * s.y / i.y, s.y) : vec2(s.x, i.y * s.x / i.x);
  vec2 offset = (rs < ri ? vec2((new.x - s.x) / 2.0, 0.0) : vec2(0.0, (new.y - s.y) / 2.0)) / new;
  vec2 uv = vTexCoord * s / new + offset;
  gl_FragColor = texture2D(uBGImageTex, uv);

  // Add a little noise. Make the noise pixels bigger so it looks more like lo-res live video.
  // And make the noise pixels square despite the aspect ratio.
  vec2 c = vTexCoord * 500.0;
  if (s.x > s.y) { c.x *= s.x / s.y; } else { c.y *= s.y / s.x; }
  c = floor(c) / 500.0;
  vec3 noise = vec3(random(c * 1.5), random(c * 2.5), random(c));
  gl_FragColor.rgb = mix(gl_FragColor.rgb, blend(gl_FragColor.rgb, noise), 0.065);

  // Not the best vignette in the world, but good enough.
  // https://github.com/mattdesl/gl-vignette-background
  float dist = length(vTexCoord - 0.5) * 0.8;
  float vignette = mix(1.0, -0.4, dist) * 2.8;
  gl_FragColor.rgb -= clamp(1.0 - vignette, 0.0, 1.0);
  //gl_FragColor.rgb = vec3(vignette); // Uncomment to see only vignette/noise.
}