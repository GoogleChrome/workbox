/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {assert} from 'workbox-core/_private/assert.mjs';
import {BroadcastCacheUpdate} from './BroadcastCacheUpdate.mjs';
import './_version.mjs';

/**
 * This plugin will automatically broadcast a message whenever a cached response
 * is updated.
 *
 * @memberof workbox.broadcastUpdate
 */
class Plugin {
  /**
   * Construct a BroadcastCacheUpdate instance with the passed options and
   * calls its `notifyIfUpdated()` method whenever the plugin's
   * `cacheDidUpdate` callback is invoked.
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
  constructor(options) {
    this._broadcastUpdate = new BroadcastCacheUpdate(options);
  }

  /**
   * A "lifecycle" callback that will be triggered automatically by the
   * `workbox-sw` and `workbox-runtime-caching` handlers when an entry is
   * added to a cache.
   *
   * @private
   * @param {Object} options The input object to this function.
   * @param {string} options.cacheName Name of the cache being updated.
   * @param {Response} [options.oldResponse] The previous cached value, if any.
   * @param {Response} options.newResponse The new value in the cache.
   * @param {Request} options.request The request that triggered the udpate.
   * @param {Request} [options.event] The event that triggered the update.
   */
  cacheDidUpdate({cacheName, oldResponse, newResponse, request, event}) {
    if (process.env.NODE_ENV !== 'production') {
      assert.isType(cacheName, 'string', {
        moduleName: 'workbox-broadcast-update',
        className: 'Plugin',
        funcName: 'cacheDidUpdate',
        paramName: 'cacheName',
      });
      assert.isInstance(newResponse, Response, {
        moduleName: 'workbox-broadcast-update',
        className: 'Plugin',
        funcName: 'cacheDidUpdate',
        paramName: 'newResponse',
      });
      assert.isInstance(request, Request, {
        moduleName: 'workbox-broadcast-update',
        className: 'Plugin',
        funcName: 'cacheDidUpdate',
        paramName: 'request',
      });
    }

    if (!oldResponse) {
      // Without a two responses there is nothing to compare.
      return;
    }
    this._broadcastUpdate.notifyIfUpdated({
      cacheName,
      oldResponse,
      newResponse,
      event,
      url: request.url,
    });
  }
}

export {Plugin};
