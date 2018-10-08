/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import '../_version.mjs';

const serializableProperties = [
  'method',
  'referrer',
  'referrerPolicy',
  'mode',
  'credentials',
  'cache',
  'redirect',
  'integrity',
  'keepalive',
];


/**
 * A class to make it easier to serialize and de-serialize requests so they
 * can be stored in IndexedDB.
 *
 * @private
 */
export default class StorableRequest {
  /**
   * Converts a Request object to a plain object that can be structured
   * cloned or JSON-stringified.
   *
   * @param {Request} request
   * @return {Promise<StorableRequest>}
   *
   * @private
   */
  static async fromRequest(request) {
    const requestInit = {headers: {}};

    // Set the body if present.
    if (request.method !== 'GET') {
      // Use blob to support non-text request bodies,
      // and clone first in case the caller still needs the request.
      requestInit.body = await request.clone().blob();
    }

    // Convert the headers from an iterable to an object.
    for (const [key, value] of request.headers.entries()) {
      requestInit.headers[key] = value;
    }

    // Add all other serializable request properties
    for (const prop of serializableProperties) {
      if (request[prop] !== undefined) {
        requestInit[prop] = request[prop];
      }
    }

    return new StorableRequest({url: request.url, requestInit});
  }

  /**
   * Accepts a URL and RequestInit dictionary that can be used to create a
   * new Request object. A timestamp is also generated so consumers can
   * reference when the object was created.
   *
   * @param {Object} param1
   * @param {string} param1.url
   * @param {Object} param1.requestInit
   *     See: https://fetch.spec.whatwg.org/#requestinit
   * @param {number} param1.timestamp The time the request was created,
   *     defaulting to the current time if not specified.
   *
   * @private
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
   *
   * @private
   */
  get timestamp() {
    return this._timestamp;
  }

  /**
   * Coverts this instance to a plain Object.
   *
   * @return {Object}
   *
   * @private
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
   *
   * @private
   */
  toRequest() {
    return new Request(this.url, this.requestInit);
  }

  /**
   * Creates and returns a deep clone of the instance.
   *
   * @return {StorableRequest}
   *
   * @private
   */
  clone() {
    const requestInit = Object.assign({}, this.requestInit);
    requestInit.headers = Object.assign({}, this.requestInit.headers);
    if (this.requestInit.body) {
      requestInit.body = this.requestInit.body.slice();
    }

    return new StorableRequest({
      url: this.url,
      timestamp: this.timestamp,
      requestInit,
    });
  }
}
