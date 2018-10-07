/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const Blob = require('./Blob');
const Headers = require('./Headers');


// Stub missing/broken Request API methods in `service-worker-mock`.
// https://fetch.spec.whatwg.org/#request-class
class Request {
  constructor(url, options = {}) {
    if (url instanceof Request) {
      options = url;
      url = options.url;
    }

    if (!url) {
      throw new TypeError(`Invalid url: ${url}`);
    }

    this.url = url;
    this.method = options.method || 'GET';
    this.mode = options.mode || 'cors';
    // See https://fetch.spec.whatwg.org/#concept-request-credentials-mode
    this.credentials = options.credentials || (this.mode === 'navigate' ?
      'include' : 'omit');
    this.headers = new Headers(options.headers);

    this._body = new Blob('body' in options ? [options.body] : []);
  }

  clone() {
    if (this.bodyUsed) {
      throw new TypeError(`Failed to execute 'clone' on 'Request': ` +
          `Request body is already used`);
    } else {
      return new Request(this.url, Object.assign({body: this._body}, this));
    }
  }

  async blob() {
    if (this.bodyUsed) {
      throw new TypeError('Already read');
    } else {
      this.bodyUsed = true;
      return this._body;
    }
  }

  async text() {
    if (this.bodyUsed) {
      throw new TypeError('Already read');
    } else {
      this.bodyUsed = true;
      // Limitionation: this assumes the stored Blob is text-based.
      return this._body._text;
    }
  }
}

module.exports = Request;
