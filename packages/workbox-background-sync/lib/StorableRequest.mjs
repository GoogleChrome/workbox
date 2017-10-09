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

const serializableProperties = [
  'method',
  'body',
  'referrer',
  'referrerPolicy',
  'mode',
  'credentials',
  'cache',
  'redirect',
  'integrity',
  'keepalive',
  'signal',
];


/**
 * A class to make it easier to serialize and de-serialize requests so they
 * can be stored in IndexedDB.
 */
export default class StorableRequest {
  /**
   * Converts a Request object to a plain object that can be structured
   * cloned or JSON-stringified.
   *
   * @param {Request} request
   * @return {Promise<StorableRequest>}
   */
  static async fromRequest(request) {
    const requestInit = {headers: {}};

    // Set the body, if used.
    if (request.bodyUsed) {
      requestInit.body = await request.text();
    }

    // Convert the headers from an iterable to an object.
    for (const [key, value] of request.headers.entries()) {
      requestInit.headers[key] = value;
    }

    // Add all other serializable request properties
    for (const prop of serializableProperties) {
      if (request[prop] != null) {
        requestInit[prop] = request[prop];
      }
    }

    return new StorableRequest({url: request.url, requestInit});
  }

  /**
   * Accepts a URL and RequestInit dictionary that can be used to create a
   * new Request object. A timestamp is also set in the event that when this
   * object was created is relevant after it's stored.
   *
   * @param {StorableRequest|Object} param1
   * @param {string} param1.url
   * @param {Object} param1.requestInit
   *     See: https://fetch.spec.whatwg.org/#requestinit
   * @param {number} param1.timestamp The time the request was created,
   *     defaulting to the current time if not specified.
   */
  constructor({url, requestInit, timestamp = Date.now()}) {
    this.url = url;
    this.requestInit = requestInit;

    // "Private"
    this._timestamp = timestamp;
  }

  /**
   * Gets the private _timestamp property.
   *
   * @return {number}
   */
  get timestamp() {
    return this._timestamp;
  }

  /**
   * Coverts this instance to a plain Object.
   *
   * @return {Object}
   */
  toObject() {
    return {
      url: this.url,
      timestamp: this.timestamp,
      requestInit: this.requestInit,
    };
  }

  /**
   * Converts this instance to a Request.
   *
   * @return {Request}
   */
  toRequest() {
    return new Request(this.url, this.requestInit);
  }
}
