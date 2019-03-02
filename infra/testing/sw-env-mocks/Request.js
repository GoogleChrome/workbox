/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const Body = require('./Body');
const Headers = require('./Headers');


// Stub missing/broken Request API methods in `service-worker-mock`.
// https://fetch.spec.whatwg.org/#request-class
class Request extends Body {
  constructor(urlOrRequest, options = {}) {
    super();

    let url = urlOrRequest;
    if (urlOrRequest instanceof Request) {
      url = urlOrRequest.url;
      options = Object.assign({}, {
        body: urlOrRequest.body,
        credentials: urlOrRequest.credentials,
        headers: urlOrRequest.headers,
        method: urlOrRequest.method,
        mode: urlOrRequest.mode,
      }, options);
    }

    if (!url) {
      throw new TypeError(`Invalid url: ${urlOrRequest}`);
    }

    this.url = new URL(url, location).href;
    this.method = options.method || 'GET';
    this.mode = options.mode || 'cors';
    // See https://fetch.spec.whatwg.org/#concept-request-credentials-mode
    this.credentials = options.credentials ||
        (this.mode === 'navigate' ? 'include' : 'omit');
    this.headers = new Headers(options.headers);

    this._body = options.body;
  }

  clone() {
    if (this.bodyUsed) {
      throw new TypeError(`Failed to execute 'clone' on 'Request': ` +
          `Request body is already used`);
    } else {
      return new Request(this.url, Object.assign({body: this._body}, this));
    }
  }
}

module.exports = Request;
