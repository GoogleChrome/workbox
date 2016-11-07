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

import RequestWrapper from './request-wrapper';

/**
 * The Handler class...
 * @memberof module:sw-runtime-caching
 */
class Handler {
  /**
   * @param {Object} input
   * @param {RequestWrapper} [input.requestWrapper]
   */
  constructor({requestWrapper} = {}) {
    if (requestWrapper) {
      this.requestWrapper = requestWrapper;
    } else {
      this.requestWrapper = new RequestWrapper();
    }
  }

  /**
   * An abstract method that must be overriden in a subclass.
   *
   * @abstract
   * @param {FetchEvent} event - The event triggered by a network request.
   * @param {Object} params - Any parameters passed in via the when predicate.
   * @return {Promise<Response>} - The Response used to fulfill the request.
   */
  handle({event, params} = {}) {
    throw Error('This abstract method must be overridden in a subclass.');
  }
}

export default Handler;
