// Terminal vertex shader. Turns a buffer of "terminal space" coordinates into
// clip space. Calculates the UVs needed to look up font bitmap data.

uniform float uTime;
uniform vec2 uScreenSize;
uniform vec2 uGridSize;
attribute vec2 aGeo;
attribute vec2 aChar;
varying vec2 vCharCoord;
varying vec2 vArea;
varying float vAttr;

const float EPSILON = 0.000001;

const float ATTR_CURSOR = 1.0;
const float ATTR_INVERSE = 2.0;
const float ATTR_BLINK = 4.0;

void main() {
  // Geometry looks like this:
  //
  // ---------.
  // |    |  /
  // |    | /
  // |____|/
  // |    /
  // |   /
  // |  /
  // | /
  // |/

  // Char is our character space triangle vertex. (0,0) means first col & row.
  float i = aGeo[0];
  float row = floor(i/uGridSize.x + EPSILON);
  float col = i - row * uGridSize.x;
  vec2 char = vec2(col, row);
  float k = aGeo[1];
  if (k == 1.0) char.x += 1.0;
  if (k == 2.0) char.y += 1.0;

  // Area is also a similar triangle, but used by the fragment shader.
  vArea = vec2(0.0, 0.0);
  if (k == 1.0) vArea.x += 2.0;
  if (k == 2.0) vArea.y += 2.0;

  // Pos converts the char coords to clip space.
  vec2 pos = char;
  if (k == 1.0) pos.x += 1.3; // Tweak character width.
  if (k == 2.0) pos.y += 1.0; // Tweak character height.
  pos = (pos / uGridSize * 2.0) - 1.0;
  pos.y *= -1.0;
  gl_Position = vec4(pos, 0, 1);

  // The second item of aChar is a bitmask of character attributes.
  vAttr = aChar[1];

  // Calculate the 128x128px (16x16 grid) Apple 2 sprite map coords.
  i = aChar[0] - 32.0;
  col = mod(i, 16.0) / 16.0;
  row = floor(i/16.0) / 16.0;
  // If this char is the cursor, make it blink the cursor symbol.
  if (mod(vAttr / ATTR_CURSOR, 2.0) >= 1.0 && mod(uTime*3.5, 2.0) <= 1.0) {
    col = 15.0/16.0;
    row = 5.0/16.0;
  }
  vCharCoord = vec2(col, row);
  // Remember, make a triangle, and make large enough to cover the character rectangle.
  if (k == 1.0) vCharCoord.x += 2.0/16.0;
  if (k == 2.0) vCharCoord.y += 2.0/16.0;
}
