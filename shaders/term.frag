// Terminal fragment shader. The vertex shader did the hard work, so this just
// draws the character.

uniform float uTime;
uniform sampler2D uFont;
varying vec2 vCharCoord;
varying vec2 vArea;
varying float vAttr;

const float ATTR_CURSOR = 1.0;
const float ATTR_INVERSE = 2.0;
const float ATTR_BLINK = 4.0;

const vec4 COLOR = vec4(.95, .45, .02, 1.0); // Amber text color

const float EPSILON = 0.000001;

void main() {
  // Trim the points of the triangle so we only draw the rectangle.
  // Without EPSILON we get a few gaps in inversed lines.
  if (vArea.x > 1.0 + EPSILON || vArea.y > 1.0 + EPSILON) discard;

  bool value = texture2D(uFont, vCharCoord).r >= 1.0;
  bool inverse = mod(vAttr / ATTR_INVERSE, 2.0) >= 1.0; // No bit shifting in GLSL. Maybe I'm wrong.

  // Comment to show only filled bars of text. Good for positioning.
  if ((value && inverse) || (!value && !inverse)) discard;

  gl_FragColor = COLOR;
}