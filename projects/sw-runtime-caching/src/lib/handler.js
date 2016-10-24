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

/** @module sw-runtime-caching.Handler **/

import CacheWrapper from './cache-wrapper';

/**
 * The Handler class...
 */
export default class Handler {
  constructor({behaviors} = {}) {
    if (behaviors) {
      this.cacheConfiguration = behaviors;
    }
  }

  get cacheWrapper() {
    if (!this._cacheWrapper) {
      this._cacheWrapper = new CacheWrapper({
        configuration: this.cacheConfiguration
      });
    }

    return this._cacheWrapper;
  }

  /**
   * An abstract method that must be overriden in a subclass.
   *
   * @param {FetchEvent} event - The event triggered by a network request.
   * @param {Object} params - Any parameters passed in via the when predicate.
   * @returns {Promise<Response} - The Response used to fulfill the request.
   */
  handle({event, params} = {}) {
    throw Error('This abstract method must be overridden in a subclass.');
  }
}
