/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import '../_version.mjs';

/**
 * A minimal `Event` subclass shim.
 * This doesn't *actually* subclass `Event` because not all browsers support
 * constructable `EventTarget`, and using a real `Event` will error.
 * @private
 */
class WorkboxEvent {
  /**
   * @param {string} type
   * @param {Object} props
   */
  constructor(type, props) {
    Object.assign(this, props, {type});
  }
}

export {WorkboxEvent};
