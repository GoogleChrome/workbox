/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import '../_version.mjs';


/**
 * A minimal `EventTarget` shim.
 * This is necessary because not all browsers support constructable
 * `EventTarget`, so using a real `EventTarget` will error.
 * @private
 */
class EventTargetShim {
  /**
   * Creates an event listener registry
   *
   * @private
   */
  constructor() {
    // A registry of event types to listeners.
    this._eventListenerRegistry = {};
  }
  /**
   * @param {string} type
   * @param {Function} listener
   * @private
   */
  addEventListener(type, listener) {
    this._getEventListenersByType(type).add(listener);
  }

  /**
   * @param {string} type
   * @param {Function} listener
   * @private
   */
  removeEventListener(type, listener) {
    this._getEventListenersByType(type).delete(listener);
  }

  /**
   * @param {Event} event
   * @private
   */
  dispatchEvent(event) {
    event.target = this;
    this._getEventListenersByType(event.type).forEach(
        (listener) => listener(event));
  }

  /**
   * Returns a Set of listeners associated with the passed event type.
   * If no handlers have been registered, an empty Set is returned.
   *
   * @param {string} type The event type.
   * @return {Set} An array of handler functions.
   * @private
   */
  _getEventListenersByType(type) {
    return this._eventListenerRegistry[type] =
        (this._eventListenerRegistry[type] || new Set());
  }
}

export {EventTargetShim};
