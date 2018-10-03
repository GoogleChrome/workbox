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

import {assert} from 'workbox-core/_private/assert.mjs';
import {logger} from 'workbox-core/_private/logger.mjs';

import {responsesAreSame} from './responsesAreSame.mjs';
import {broadcastUpdate} from './broadcastUpdate.mjs';

import {DEFAULT_HEADERS_TO_CHECK, DEFAULT_BROADCAST_CHANNEL_NAME,
    DEFAULT_DEFER_NOTIFICATION_TIMEOUT} from './utils/constants.mjs';


import './_version.mjs';


/**
 * Uses the [Broadcast Channel API]{@link https://developers.google.com/web/updates/2016/09/broadcastchannel}
 * to notify interested parties when a cached response has been updated.
 * In browsers that do not support the Broadcast Channel API, the instance
 * falls back to sending the update via `postMessage()` to all window clients.
 *
 * For efficiency's sake, the underlying response bodies are not compared;
 * only specific response headers are checked.
 *
 * @memberof workbox.broadcastUpdate
 */
class BroadcastCacheUpdate {
  /**
   * Construct a BroadcastCacheUpdate instance with a specific `channelName` to
   * broadcast messages on
   *
   * @param {Object} options
   * @param {Array<string>}
   *     [options.headersToCheck=['content-length', 'etag', 'last-modified']]
   *     A list of headers that will be used to determine whether the responses
   *     differ.
   * @param {string} [options.channelName='workbox'] The name that will be used
   *.    when creating the `BroadcastChannel`, which defaults to 'workbox' (the
   *     channel name used by the `workbox-window` package).
   * @param {string} [options.deferNoticationTimeout=10000] The amount of time
   *     to wait for a ready message from the window on navigation requests
   *     before sending the update.
   */
  constructor({headersToCheck, channelName, deferNoticationTimeout} = {}) {
    this._headersToCheck = headersToCheck || DEFAULT_HEADERS_TO_CHECK;
    this._channelName = channelName || DEFAULT_BROADCAST_CHANNEL_NAME;
    this._deferNoticationTimeout =
        deferNoticationTimeout || DEFAULT_DEFER_NOTIFICATION_TIMEOUT;

    if (process.env.NODE_ENV !== 'production') {
      assert.isType(this._channelName, 'string', {
        moduleName: 'workbox-broadcast-cache-update',
        className: 'BroadcastCacheUpdate',
        funcName: 'constructor',
        paramName: 'channelName',
      });
      assert.isArray(this._headersToCheck, {
        moduleName: 'workbox-broadcast-cache-update',
        className: 'BroadcastCacheUpdate',
        funcName: 'constructor',
        paramName: 'headersToCheck',
      });
    }

    // The message listener needs to be added in the initial run of the
    // service worker, but since we don't actually need to be listening for
    // messages until the cache updates, we only invoke the callback if set.
    this._onReadyMessageCallback = null;
    self.addEventListener('message', (event) => {
      if (event.data.type === 'WINDOW_READY' &&
          event.data.meta === 'workbox-window') {
        if (this._onReadyMessageCallback) {
          if (process.env.NODE_ENV !== 'production') {
            logger.debug(`Received WINDOW_READY event: `, event);
          }
          this._onReadyMessageCallback();
        }
      }
    });
  }

  /**
   * Compare two [Responses](https://developer.mozilla.org/en-US/docs/Web/API/Response)
   * and send a message via the
   * {@link https://developers.google.com/web/updates/2016/09/broadcastchannel|Broadcast Channel API}
   * if they differ.
   *
   * Neither of the Responses can be {@link http://stackoverflow.com/questions/39109789|opaque}.
   *
   * @param {Object} options
   * @param {Response} options.oldResponse Cached response to compare.
   * @param {Response} options.newResponse Possibly updated response to compare.
   * @param {string} options.url The URL of the request.
   * @param {string} options.cacheName Name of the cache the responses belong
   *     to. This is included in the broadcast message.
   * @param {Event} [options.event] event An optional event that triggered
   *     this possible cache update.
   * @return {Promise} Resolves once the update is sent.
   */
  notifyIfUpdated({oldResponse, newResponse, url, cacheName, event}) {
    if (!responsesAreSame(oldResponse, newResponse, this._headersToCheck)) {
      if (process.env.NODE_ENV !== 'production') {
        logger.log(`Newer response found (and cached) for:`, url);
      }

      const sendUpdate = async () => {
        // In the case of a navigation request, the requesting page will likely
        // not have loaded its JavaScript in time to recevied the update
        // notification, so we defer it until ready (or we timeout waiting).
        if (event && event.request.mode === 'navigate') {
          if (process.env.NODE_ENV !== 'production') {
            logger.debug(`Original request was a navigation request, ` +
                `waiting for a ready message from the window`, event.request);
          }
          await this._windowReadyOrTimeout();
        }
        await broadcastUpdate({channel: this._getChannel(), cacheName, url});
      };

      // Send the update and ensure the SW stays alive until it's sent.
      const done = sendUpdate();
      if (event) {
        event.waitUntil(done);
      }
      return done;
    }
  }

  /**
   * @return {BroadcastChannel|undefined} The BroadcastChannel instance used for
   * broadcasting updates, or undefined if the browser doesn't support the
   * Broadcast Channel API.
   *
   * @private
   */
  _getChannel() {
    if (('BroadcastChannel' in self) && !this._channel) {
      this._channel = new BroadcastChannel(this._channelName);
    }
    return this._channel;
  }

  /**
   * Waits for a message from the window indicating that it's capable of
   * receiving broadcasts. By default, this will only wait for the amount of
   * specified via the `deferNoticationTimeout` option.
   *
   * @private
   */
  async _windowReadyOrTimeout() {
    await new Promise((resolve) => {
      let timeout;

      // Set a callback so that if a message comes in within the next
      // few seconds the promise will resolve.
      this._onReadyMessageCallback = () => {
        this._onReadyMessageCallback = null;
        clearTimeout(timeout);
        resolve();
      };

      // But don't wait too long for the message since it may never come.
      timeout = setTimeout(() => {
        if (process.env.NODE_ENV !== 'production') {
          logger.debug(`Timed out after ${this._deferNoticationTimeout}` +
              `ms waiting for message from window`);
        }
        resolve();
      }, this._deferNoticationTimeout);
    });
  }
}

export {BroadcastCacheUpdate};
