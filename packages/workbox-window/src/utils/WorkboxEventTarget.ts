/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {WorkboxEvent} from './WorkboxEvent.js';
import '../_version.js';


export type ListenerCallback = (event: WorkboxEvent) => void;


/**
 * A minimal `EventTarget` shim.
 * This is necessary because not all browsers support constructable
 * `EventTarget`, so using a real `EventTarget` will error.
 * @private
 */
export class WorkboxEventTarget {
  private _eventListenerRegistry: {[type: string]: Set<ListenerCallback>} = {};

  /**
   * @param {string} type
   * @param {Function} listener
   * @private
   */
  addEventListener(type: string, listener: ListenerCallback) {
    this._getEventListenersByType(type).add(listener);
  }

  /**
   * @param {string} type
   * @param {Function} listener
   * @private
   */
  removeEventListener(type: string, listener: ListenerCallback) {
    this._getEventListenersByType(type).delete(listener);
  }

  /**
   * @param {Object} event
   * @private
   */
  dispatchEvent(event: WorkboxEvent) {
    event.target = this;

    const listeners = this._getEventListenersByType(event.type)
    for (const listener of listeners) {
      listener(event);
    }
  }

  /**
   * Returns a Set of listeners associated with the passed event type.
   * If no handlers have been registered, an empty Set is returned.
   *
   * @param {string} type The event type.
   * @return {Set<ListenerCallback>} An array of handler functions.
   * @private
   */
  private _getEventListenersByType(type: string) {
    return this._eventListenerRegistry[type] =
        (this._eventListenerRegistry[type] || new Set());
  }
}
