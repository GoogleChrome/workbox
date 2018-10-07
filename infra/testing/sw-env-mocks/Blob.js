// Blob
// https://w3c.github.io/FileAPI/#dom-blob-blob
class Blob {
  constructor(blobParts, options = {}) {
    if (typeof blobParts === 'undefined') {
      blobParts = [];
    }
    if (!Array.isArray(blobParts)) {
      throw new TypeError(`Failed to construct 'Blob': ` +
          `The provided value cannot be converted to a sequence.`);
    }

    this._parts = blobParts;
    this._type = options.type || '';
  }

  get size() {
    let size = 0;
    for (const part of this._parts) {
      size += part instanceof Blob ? part.size : String(part).length;
    }
    return size;
  }

  get type() {
    return this._type;
  }

  // Warning: non-standard, but used in other mocks for simplicity.
  get _text() {
    let text = '';
    for (const part of this._parts) {
      text += part instanceof Blob ? part._text : String(part);
    }
    return text;
  }

  slice(start, end, type) {
    const bodyString = this._text;
    const slicedBodyString = bodyString.substring(start, end);
    return new Blob([slicedBodyString], {type});
  }
}

module.exports = Blob;
