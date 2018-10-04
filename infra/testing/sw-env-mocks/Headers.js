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


// Stub missing/broken Headers API methods in `service-worker-mock`.
// https://fetch.spec.whatwg.org/#headers-class
class Headers {
  constructor(init = {}) {
    if (init instanceof Headers) {
      this.obj = Object.assign({}, init.obj);
    } else {
      this.obj = Object.assign({}, init);
    }
  }

  has(key) {
    return (key in this.obj);
  }

  get(key) {
    return this.has(key) ? this.obj[key] : null;
  }

  set(key, value) {
    this.obj[key] = value;
  }

  entries() {
    return Object.entries(this.obj);
  }

  // TODO: implement append() and [Symbol.iterator]()

  forEach(cb) {
    Object.keys(this.obj).forEach((key) => {
      cb(this.obj[key], key);
    });
  }
}

module.exports = Headers;
