/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const Blob = require('./Blob');


// https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
// Note, the original post uses Uint16Array and allocates 2 bytes per character
// but native implementations of methods that convert strings to ArrayBuffers
// don't do that for ASCII strings, so we'll stick to str.length and only use
// ASCII in tests until we switch our test infrastructure to run in real
// browsers.
function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}

function str2ab(str) {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

// https://fetch.spec.whatwg.org/#body
class Body {
  async arrayBuffer() {
    if (this.bodyUsed) {
      throw new TypeError('Already read');
    } else {
      this.bodyUsed = true;

      if (typeof this._body === 'undefined') {
        return new ArrayBuffer();
      }
      if (typeof this._body === 'string') {
        return str2ab(this._body);
      }
      if (this._body instanceof ArrayBuffer) {
        return this._body;
      }
      if (this._body instanceof Blob) {
        // `_text` is non-standard, but easier for the mocks.
        return str2ab(this._body._text);
      }
    }
  }

  async blob() {
    if (this.bodyUsed) {
      throw new TypeError('Already read');
    } else {
      this.bodyUsed = true;

      if (typeof this._body === 'undefined') {
        return new Blob();
      }
      if (typeof this._body === 'string') {
        return new Blob([this._body]);
      }
      if (this._body instanceof ArrayBuffer) {
        // `_text` is non-standard, but easier for the mocks.
        return new Blob([ab2str(this._body)]);
      }
      if (this._body instanceof Blob) {
        return this._body;
      }
    }
  }

  async text() {
    if (this.bodyUsed) {
      throw new TypeError('Already read');
    } else {
      this.bodyUsed = true;

      if (typeof this._body === 'undefined') {
        return new '';
      }
      if (typeof this._body === 'string') {
        return this._body;
      }
      if (this._body instanceof ArrayBuffer) {
        return ab2str(this._body);
      }
      if (this._body instanceof Blob) {
        // `_text` is non-standard, but easier for the mocks.
        return this._body._text;
      }
    }
  }
}

module.exports = Body;
