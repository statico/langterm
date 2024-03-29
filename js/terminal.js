//
// Terminal emulator that allows clients to get a view buffer. Supports
// character modes, such as inverse and blink.
//
class Terminal {
  constructor() {
    this.width = 60;
    this.height = 24;
    this.page = this.width * this.height;
    this.cursor = { x: 0, y: 0, visible: true };
    this.buffer = new Array(this.page * 5); // 5 pages of scrollback
    this.attrs = new Array(this.buffer.length);
    this.offset = this.page * 4;
    for (let i = 0, len = this.buffer.length; i < len; i++) {
      this.buffer[i] = " ";
      this.attrs[i] = 0;
    }
    this._charBuffer = new Float32Array(this.buffer.length * 6);
    this._geoBuffer = new Float32Array(this.buffer.length * 6);
    this.clear();
  }

  // Clear the screen.
  clear() {
    this.end();
    this.cursor.x = 0;
    this.cursor.y = 0;
    const o = this.offset;
    for (let i = 0, len = this.page; i < len; i++) {
      this.buffer[i + o] = " ";
      this.attrs[i + o] = 0;
    }
    this._dirty = true;
  }

  // Fill the screen with a character.
  fill(char) {
    this.clear();
    for (let i = 0; i < this.width * this.height - 1; i++) {
      this.addChar(char);
    }
  }

  // Add a whole string to the terminal, optionally wrapping text.
  addString(str, wrap, attrs = 0) {
    this.end();
    if (!str.length) return;
    if (wrap) {
      // https://www.rosettacode.org/wiki/Word_wrap#JavaScript
      str = str
        .match(RegExp(".{1," + (this.width - 2) + "}(\\s|$)", "g"))
        .join("\n");
    }
    for (let i = 0; i < str.length; i++) {
      this.addChar(str.charAt(i), attrs);
    }
  }

  // Add a single char to the terminal.
  addChar(c, attrs) {
    this.end();
    const i = this.cursor.y * this.width + this.cursor.x;
    const o = this.offset;
    if (c !== "\n") {
      this.buffer[i + o] = c;
      this.attrs[i + o] = attrs || 0;
    }
    if (c === "\n" || this.cursor.x >= this.width - 1) {
      this.cursor.x = 0;
      this.cursor.y++;
    } else {
      this.cursor.x++;
    }
    if (this.cursor.y >= this.height) {
      this.cursor.y--;
      const lastLine = this.buffer.length - this.width;
      for (let i = 0, len = this.buffer.length; i < len; i++) {
        if (i < lastLine) {
          this.buffer[i] = this.buffer[i + this.width];
          this.attrs[i] = this.attrs[i + this.width];
        } else {
          this.buffer[i] = " ";
          this.attrs[i] = 0;
        }
      }
    }
    this._dirty = true;
  }

  pageUp() {
    this.offset = Math.max(0, this.offset - this.page);
    this.cursor.visible = false;
    this._dirty = true;
  }

  pageDown() {
    this.offset = Math.min(
      this.buffer.length - this.page,
      this.offset + this.page
    );
    this.cursor.visible = this.offset === this.buffer.length - this.page;
    this._dirty = true;
  }

  end() {
    this.offset = this.buffer.length - this.page;
    this.cursor.visible = true;
    this._dirty = true;
  }

  backspace() {
    if (this.cursor.x <= 0) return;
    const o = this.offset;
    const i = this.cursor.y * this.width + this.cursor.x - 1;
    // Assume there is a '>' in the first column as a prompt.
    if (!(this.cursor.x === 1 && this.buffer[i + o] === ">")) {
      this.buffer[i + o] = " ";
      this.attrs[i + o] = 0;
      this.cursor.x--;
      this._dirty = true;
    }
  }

  clearToStartOfLine() {
    const o = this.offset;
    while (this.cursor.x > 0) {
      const i = this.cursor.y * this.width + this.cursor.x;
      this.buffer[i + o] = " ";
      this.attrs[i + o] = 0;
      this.cursor.x--;
    }
    this._dirty = true;
  }

  _update() {
    if (!this._dirty) return;
    const o = this.offset;
    for (let i = 0, len = this.page; i < len; i++) {
      const j = i * 6;
      const c = this.buffer[i + o].charCodeAt(0);
      let a = this.attrs[i + o];
      const y = Math.floor(i / this.width);
      const x = i - y * this.width;
      if (this.cursor.visible && this.cursor.x === x && this.cursor.y === y)
        a |= Terminal.ATTR_CURSOR;
      this._charBuffer[j + 0] = c;
      this._charBuffer[j + 1] = a;
      this._charBuffer[j + 2] = c;
      this._charBuffer[j + 3] = a;
      this._charBuffer[j + 4] = c;
      this._charBuffer[j + 5] = a;
      this._geoBuffer[j + 0] = i;
      this._geoBuffer[j + 1] = 0;
      this._geoBuffer[j + 2] = i;
      this._geoBuffer[j + 3] = 1;
      this._geoBuffer[j + 4] = i;
      this._geoBuffer[j + 5] = 2;
    }
    this._dirty = false;
  }

  getCharBuffer() {
    this._update();
    return this._charBuffer;
  }

  getGeoBuffer() {
    this._update();
    return this._geoBuffer;
  }

  // Useful for debugging.
  toString() {
    const out = new Array(this.page);
    for (let i = 0, len = this.page; i < len; i++) {
      out[i] =
        this.buffer[i + o] + (i !== 0 && i % this.width === 0 ? "\n" : "");
    }
    return out.join("");
  }
}

Terminal.ATTR_CURSOR = 1;
Terminal.ATTR_INVERSE = 2;
Terminal.ATTR_BLINK = 4;
