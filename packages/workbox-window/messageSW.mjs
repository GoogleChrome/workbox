/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import './_version.mjs';


/**
 * Sends a data object to a service worker via `postMessage` and resolves
 * and resolves with a response (if any).
 *
 * A response can be set in a message handler in the service worker by
 * calling `event.ports[0].postMessage(...)`, which will resolve the promise
 * returned by `messageSW()`. If no response is set, the promise will not
 * resolve unless an optional timeout value is passed, in which case the
 * promise will resolve with undefined if it hasn't been resolved after
 * that amount of time.
 *
 * @param {ServiceWorker} sw The service worker to send the message to.
 * @param {Object} data An object to send to the service worker.
 * @param {Object} [timeout] If set, the amount of time to wait before
 *     resolving the promise to `undefined`.
 * @return {Promise<Object|undefined>}
 *
 * @memberof module:workbox-window
 */
const messageSW = (sw, data, timeout) => {
  return new Promise((resolve) => {
    let messageChannel = new MessageChannel();
    messageChannel.port1.onmessage = (evt) => resolve(evt.data);
    sw.postMessage(data, [messageChannel.port2]);

    if (timeout) {
      setTimeout(resolve, timeout);
    }
  });
};

export {messageSW};
