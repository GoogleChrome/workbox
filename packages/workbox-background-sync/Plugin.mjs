/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {Queue} from './Queue.mjs';
import './_version.mjs';

/**
 * A class implementing the `fetchDidFail` lifecycle callback. This makes it
 * easier to add failed requests to a background sync Queue.
 *
 * @memberof workbox.backgroundSync
 */
class Plugin {
  /**
   * @param {...*} queueArgs Args to forward to the composed Queue instance.
   *    See the [Queue]{@link workbox.backgroundSync.Queue} documentation for
   *    parameter details.
   */
  constructor(...queueArgs) {
    this._queue = new Queue(...queueArgs);
    this.fetchDidFail = this.fetchDidFail.bind(this);
  }

  /**
   * @param {Object} options
   * @param {Request} options.request
   * @private
   */
  async fetchDidFail({request}) {
    await this._queue.pushRequest({request});
  }
}

export {Plugin};
