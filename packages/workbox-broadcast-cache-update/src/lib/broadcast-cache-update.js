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

import ErrorFactory from './error-factory';
import assert from '../../../../lib/assert';
import broadcastUpdate from './broadcast-update';
import responsesAreSame from './responses-are-same';
import {defaultHeadersToCheck, defaultSource} from './constants';

/**
 * Can be used to compare two [Responses](https://developer.mozilla.org/en-US/docs/Web/API/Response)
 * and uses the {@link https://developers.google.com/web/updates/2016/09/broadcastchannel|Broadcast Channel API}
 * to notify interested parties when those responses differ.
 *
 * For efficiency's sake, the underlying response bodies are not compared;
 * only specific response headers are checked.
 *
 * This class can be used inside any service worker, without having to use any
 * of the other modules in this repo.
 *
 * If you'd like to use this functionality but are already using `workbox-sw` or
 * `workbox-runtime-caching`, then please see the corresponding plugin,
 * `BroadcastCacheUpdatePlugin`, for a easy integration.
 *
 * @example <caption>Using BroadcastCacheUpdate when you're handling your
 * own fetch and request logic.</caption>
 *
 * const url = '/path/to/file';
 * const cacheName = 'my-runtime-cache';
 * const bcu = new goog.broadcastCacheUpdate.BroadcastCacheUpdate(
 *   {channelName: 'cache-updates'});
 *
 * Promise.all([
 *   caches.open(cacheName).then((cache) => cache.match(url)),
 *   fetch(url),
 * ]).then(([first, second]) => {
 *   if (first) {
 *     bcu.notifyIfUpdated({cacheName, first, second});
 *   }
 * });
 *
 * @memberof module:workbox-broadcast-cache-update
 */
class BroadcastCacheUpdate {
  /**
   * Dispatches cache update messages when a cached response has been updated.
   * Messages will be dispatched on a broadcast channel with the name provided
   * as channelName parameter in the constructor.
   *
   * @param {Object} input
   * @param {string} input.channelName The name that will be used when creating
   *        the `BroadcastChannel`.
   * @param {Array<string>} input.headersToCheck A list of headers that will be
   *        used to determine whether the responses differ. Defaults to
   *        `['content-length', 'etag', 'last-modified']`.
   * @param {string} input.source An attribution value that indicates where
   *        the update originated. Defaults to 'workbox-broadcast-cache-update'.
   */
  constructor({channelName, headersToCheck, source}={}) {
    if (typeof channelName !== 'string' || channelName.length === 0) {
      throw ErrorFactory.createError('channel-name-required');
    }

    this.channelName = channelName;
    this.headersToCheck = headersToCheck || defaultHeadersToCheck;
    this.source = source || defaultSource;
  }

  /**
   * @private
   * @return {BroadcastChannel} The underlying
   *          [`BroadcastChannel`](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel/BroadcastChannel)
   *          instance used for broadcasting updates.
   */
  get channel() {
    if (!this._channel) {
      this._channel = new BroadcastChannel(this.channelName);
    }
    return this._channel;
  }

  /**
   * An explicit method to call from your own code to trigger the comparison of
   * two [Responses](https://developer.mozilla.org/en-US/docs/Web/API/Response)
   * and fire off a notification via the
   * {@link https://developers.google.com/web/updates/2016/09/broadcastchannel|Broadcast Channel API}
   * if they differ.
   *
   * @param {Object} input The input object to this function.
   * @param {Response} input.first One of the responses to compare.
   *        This should not be an {@link http://stackoverflow.com/questions/39109789|opaque response}.
   * @param {Response} input.second Another of the respones to compare.
   *        This should not be an {@link http://stackoverflow.com/questions/39109789|opaque response}.
   * @param {string} input.cacheName Name of the cache the responses belong to.
   * @param {string} input.url The cache key URL.
   */
  notifyIfUpdated({first, second, cacheName, url}) {
    assert.isType({cacheName}, 'string');

    if (
      !responsesAreSame({first, second, headersToCheck: this.headersToCheck})) {
      broadcastUpdate({cacheName, url,
        channel: this.channel, source: this.source});
    }
  }
}

export default BroadcastCacheUpdate;
