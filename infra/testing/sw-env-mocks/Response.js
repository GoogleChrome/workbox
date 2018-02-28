/*
 Copyright 2017 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

const Blob = require('./Blob');
const Headers = require('./Headers');

// Stub missing/broken Response API methods in `service-worker-mock`.
// https://fetch.spec.whatwg.org/#response-class
class Response {
  constructor(body, options = {}) {
    this._body = new Blob([body]);
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

module.exports = Response;
