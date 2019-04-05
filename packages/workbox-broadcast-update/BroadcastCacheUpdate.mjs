/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {assert} from 'workbox-core/_private/assert.mjs';
import {getFriendlyURL} from 'workbox-core/_private/getFriendlyURL.mjs';
import {logger} from 'workbox-core/_private/logger.mjs';
import {Deferred} from 'workbox-core/_private/Deferred.mjs';
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
        moduleName: 'workbox-broadcast-update',
        className: 'BroadcastCacheUpdate',
        funcName: 'constructor',
        paramName: 'channelName',
      });
      assert.isArray(this._headersToCheck, {
        moduleName: 'workbox-broadcast-update',
        className: 'BroadcastCacheUpdate',
        funcName: 'constructor',
        paramName: 'headersToCheck',
      });
    }

    this._initWindowReadyDeferreds();
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
        if (event && event.request && event.request.mode === 'navigate') {
          if (process.env.NODE_ENV !== 'production') {
            logger.debug(`Original request was a navigation request, ` +
                `waiting for a ready message from the window`, event.request);
          }
          await this._windowReadyOrTimeout(event);
        }
        await this._broadcastUpdate({
          channel: this._getChannel(),
          cacheName,
          url,
        });
      };

      // Send the update and ensure the SW stays alive until it's sent.
      const done = sendUpdate();

      if (event) {
        try {
          event.waitUntil(done);
        } catch (error) {
          if (process.env.NODE_ENV !== 'production') {
            logger.warn(`Unable to ensure service worker stays alive ` +
                `when broadcasting cache update for ` +
                `${getFriendlyURL(event.request.url)}'.`);
          }
        }
      }
      return done;
    }
  }

  /**
   * NOTE: this is exposed on the instance primarily so it can be spied on
   * in tests.
   *
   * @param {Object} opts
   * @private
   */
  async _broadcastUpdate(opts) {
    await broadcastUpdate(opts);
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
   * time specified via the `deferNoticationTimeout` option.
   *
   * @param {Event} event The navigation fetch event.
   * @return {Promise}
   * @private
   */
  _windowReadyOrTimeout(event) {
    if (!this._navigationEventsDeferreds.has(event)) {
      const deferred = new Deferred();

      // Set the deferred on the `_navigationEventsDeferreds` map so it will
      // be resolved when the next ready message event comes.
      this._navigationEventsDeferreds.set(event, deferred);

      // But don't wait too long for the message since it may never come.
      const timeout = setTimeout(() => {
        if (process.env.NODE_ENV !== 'production') {
          logger.debug(`Timed out after ${this._deferNoticationTimeout}` +
              `ms waiting for message from window`);
        }
        deferred.resolve();
      }, this._deferNoticationTimeout);

      // Ensure the timeout is cleared if the deferred promise is resolved.
      deferred.promise.then(() => clearTimeout(timeout));
    }
    return this._navigationEventsDeferreds.get(event).promise;
  }

  /**
   * Creates a mapping between navigation fetch events and deferreds, and adds
   * a listener for message events from the window. When message events arrive,
   * all deferreds in the mapping are resolved.
   *
   * Note: it would be easier if we could only resolve the deferred of
   * navigation fetch event whose client ID matched the source ID of the
   * message event, but currently client IDs are not exposed on navigation
   * fetch events: https://www.chromestatus.com/feature/4846038800138240
   *
   * @private
   */
  _initWindowReadyDeferreds() {
    // A mapping between navigation events and their deferreds.
    this._navigationEventsDeferreds = new Map();

    // The message listener needs to be added in the initial run of the
    // service worker, but since we don't actually need to be listening for
    // messages until the cache updates, we only invoke the callback if set.
    self.addEventListener('message', (event) => {
      if (event.data.type === 'WINDOW_READY' &&
          event.data.meta === 'workbox-window' &&
          this._navigationEventsDeferreds.size > 0) {
        if (process.env.NODE_ENV !== 'production') {
          logger.debug(`Received WINDOW_READY event: `, event);
        }
        // Resolve any pending deferreds.
        for (const deferred of this._navigationEventsDeferreds.values()) {
          deferred.resolve();
        }
        this._navigationEventsDeferreds.clear();
      }
    });
  }
}

export {BroadcastCacheUpdate};
