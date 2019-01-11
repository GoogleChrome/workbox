/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import '../_version.mjs';


/**
 * A minimal EventTarget class shim.
 * This is used if the browser doesn't natively support constructable
 * EventTarget objects.
 * @private
 */
export class EventTargetShim {
  /**
   * Creates an event listener registry
   */
  constructor() {
    // A registry of event types to listeners.
    this._eventListenerRegistry = {};
  }
  /**
   * @param {string} type
   * @param {Function} listener
   */
  addEventListener(type, listener) {
    this._getEventListenersByType(type).add(listener);
  }

  /**
   * @param {string} type
   * @param {Function} listener
   */
  removeEventListener(type, listener) {
    this._getEventListenersByType(type).remove(listener);
  }

  /**
   * @param {string} type
   * @param {*} arg
   */
  _dispatchEvent(type, arg) {
    this._getEventListenersByType(type).forEach((listener) => listener(arg));
  }

  /**
   * Returns a Set of listeners associated with the passed event type.
   * If no handlers have been registered, an empty Set is returned.
   *
   * @param {string} type The event type.
   * @return {Set} An array of handler functions.
   */
  _getEventListenersByType(type) {
    return this._eventListenerRegistry[type] =
        (this._eventListenerRegistry[type] || new Set());
  }
}
