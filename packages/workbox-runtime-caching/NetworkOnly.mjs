/*
 Copyright 2016 Google Inc. All Rights Reserved.
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

import {
  cacheNames,
  fetchWrapper,
  assert,
} from 'workbox-core/_private.mjs';
import messages from './utils/messages.mjs';
import printMessages from './utils/printMessages.mjs';
import './_version.mjs';

/**
 * An implementation of a
 * [network-only]{@link https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#network-only}
 * request strategy.
 *
 * This class is useful if you want to take advantage of the Workbox plugins.
 *
 * @memberof module:workbox-runtime-caching
 */
class NetworkOnly {
  /**
   * @param {Object} options
   * @param {string} options.cacheName Cache name to store and retrieve
   * requests. Defaults to cache names provided by `workbox-core`.
   * @param {string} options.plugins Workbox plugins you may want to use in
   * conjunction with this caching strategy.
   */
  constructor(options = {}) {
    this._cacheName = cacheNames.getRuntimeName(options.cacheName);
    this._plugins = options.plugins || [];
  }

  /**
   * This method will be called by the Workbox
   * [Router]{@link module:workbox-routing.Router} to handle a fetch event.
   *
   * @param {Object} input
   * @param {FetchEvent} input.event The fetch event to handle.
   * @param {URL} input.url The URL of the request.
   * @param {Object} input.params Any params returned by `Routes` match
   * callback.
   * @return {Promise<Response>}
   */
  async handle({url, event, params}) {
    const logMessages = [];
    if (process.env.NODE_ENV !== 'production') {
      assert.isInstance(event, FetchEvent, {
        moduleName: 'workbox-runtime-caching',
        className: 'NetworkOnly',
        funcName: 'handle',
        paramName: 'event',
      });
    }

    let error;
    let response;
    try {
      response = await fetchWrapper.fetch(
        event.request,
        null,
        this._plugins
      );

      if (process.env.NODE_ENV !== 'production') {
        if (response) {
          if (process.env.NODE_ENV !== 'production') {
            logMessages.push(messages.networkRequestReturned(event, response));
          }
        } else {
          logMessages.push(messages.networkRequestInvalid(event));
        }
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        logMessages.push(messages.networkRequestError(event, err));
      }

      error = err;
    }

    if (process.env.NODE_ENV !== 'production') {
      printMessages('NetworkOnly', event, logMessages, response);
    }

    // If there was an error thrown, re-throw it to ensure the Routers
    // catch handler is triggered.
    if (error) {
      throw error;
    }

    return response;
  }
}

export {NetworkOnly};
