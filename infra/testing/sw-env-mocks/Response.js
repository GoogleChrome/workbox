/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const Body = require('./Body');
const Headers = require('./Headers');


// Stub missing/broken Response API methods in `service-worker-mock`.
// https://fetch.spec.whatwg.org/#response-class
class Response extends Body {
  constructor(body, options = {}) {
    super();

    this._body = body;

    this.status = typeof options.status === 'number' ? options.status : 200;
    this.ok = this.status >= 200 && this.status < 300;
    this.statusText = options.statusText || 'OK';
    this.headers = new Headers(options.headers);
    this.type = this.status === 0 ? 'opaque' : 'basic';
    this.redirected = false;
    this.url = 'http://example.com/asset';
    this.method = (options && options.method) || 'GET';
  }

  clone() {
    if (this.bodyUsed) {
      throw new TypeError(`Failed to execute 'clone' on 'Response': ` +
        `Response body is already used`);
    } else {
      return new Response(this._body, this);
    }
  }
}

module.exports = Response;
