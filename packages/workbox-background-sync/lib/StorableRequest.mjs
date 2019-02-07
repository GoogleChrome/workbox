/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {assert} from 'workbox-core/_private/assert.mjs';
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
class StorableRequest {
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
    const requestData = {
      url: request.url,
      headers: {},
    };

    // Set the body if present.
    if (request.method !== 'GET') {
      // Use blob to support non-text request bodies,
      // and clone first in case the caller still needs the request.
      requestData.body = await request.clone().blob();
    }

    // Convert the headers from an iterable to an object.
    for (const [key, value] of request.headers.entries()) {
      requestData.headers[key] = value;
    }

    // Add all other serializable request properties
    for (const prop of serializableProperties) {
      if (request[prop] !== undefined) {
        requestData[prop] = request[prop];
      }
    }

    return new StorableRequest(requestData);
  }

  /**
   * Accepts an object of request data that can be used to construct a
   * `Request` but can also be stored in IndexedDB.
   *
   * @param {Object} requestData An object of request data that includes the
   *     `url` plus any relevant properties of
   *     [requestInit]{@link https://fetch.spec.whatwg.org/#requestinit}.
   * @private
   */
  constructor(requestData) {
    if (process.env.NODE_ENV !== 'production') {
      assert.isType(requestData, 'object', {
        moduleName: 'workbox-background-sync',
        className: 'StorableRequest',
        funcName: 'constructor',
        paramName: 'requestData',
      });
      assert.isType(requestData.url, 'string', {
        moduleName: 'workbox-background-sync',
        className: 'StorableRequest',
        funcName: 'constructor',
        paramName: 'requestData.url',
      });
    }

    this._requestData = requestData;
  }

  /**
   * Returns a deep clone of the instances `_requestData` object.
   *
   * @return {Object}
   *
   * @private
   */
  toObject() {
    const requestData = Object.assign({}, this._requestData);
    requestData.headers = Object.assign({}, this._requestData.headers);
    if (requestData.body) {
      requestData.body = requestData.body.slice();
    }

    return requestData;
  }

  /**
   * Converts this instance to a Request.
   *
   * @return {Request}
   *
   * @private
   */
  toRequest() {
    return new Request(this._requestData.url, this._requestData);
  }

  /**
   * Creates and returns a deep clone of the instance.
   *
   * @return {StorableRequest}
   *
   * @private
   */
  clone() {
    return new StorableRequest(this.toObject());
  }
}

export {StorableRequest};
