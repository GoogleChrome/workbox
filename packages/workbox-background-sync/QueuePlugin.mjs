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

import './_version.mjs';

/**
 * A class implementing the `fetchDidFail` lifecycle callback. This makes it
 * easier to add failed requests to a background sync Queue.
 *
 * @memberof workbox.backgroundSync
 */
class QueuePlugin {
  /**
   * @param {Queue} queue The Queue instance to add failed requests to.
   */
  constructor(queue) {
    this._queue = queue;
    this.fetchDidFail = this.fetchDidFail.bind(this);
  }

  /**
   * @param {Object} options
   * @param {Request} options.request
   * @private
   */
  async fetchDidFail({request}) {
    await this._queue.addRequest(request);
  }
}

export {QueuePlugin};
