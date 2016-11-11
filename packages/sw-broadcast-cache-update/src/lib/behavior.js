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

import assert from '../../../../lib/assert';
import broadcastUpdate from './broadcast-update';
import responsesAreSame from './responses-are-same';
import {defaultHeadersToCheck, defaultSource} from './constants';

/**
 * @memberof module:sw-broadcast-cache-update
 *
 * @example
 * // Used as an automatically invoked as "behavior" by a RequestWrapper:
 *
 * const requestWrapper = new goog.runtimeCaching.RequestWrapper({
 *   cacheName: 'runtime-cache',
 *   behaviors: [
 *     new goog.broadcastCacheUpdate.Behavior({channelName: 'cache-updates'})
 *   ]
 * });
 *
 * // Set up a route to match any requests made against the example.com domain.
 * // The requests will be handled with a stale-while-revalidate policy, and the
 * // cache update notification behavior, as configured in requestWrapper, will
 * // be automatically applied.
 * const route = new goog.routing.RegExpRoute({
 *   match: ({url}) => url.domain === 'example.com',
 *   handler: new goog.runtimeCaching.StaleWhileRevalidate({requestWrapper})
 * });
 *
 * @example
 * // Explicitly invoked usage independent of the goog.routing framework, via
 * // the notifyIfUpdated() method:
 *
 * const cacheUpdateBehavior = new goog.broadcastCacheUpdates.Behavior({
 *   channelName: 'cache-updates'
 * });
 *
 * const url = 'https://example.com';
 * const cacheName = 'runtime-cache';
 *
 * const cache = await caches.open(cacheName);
 * const oldResponse = await cache.match(url);
 * const newResponse = await fetch(url);
 * await cache.put(url, newResponse);
 *
 * // Only check for an update if there was a previously cached Response.
 * if (oldResponse) {
 *   cacheUpdateBehavior.notifyIfUpdated({
 *     first: oldResponse,
 *     second: newResponse,
 *     cacheName
 *   });
 * }
 */
class Behavior {
  /**
   * Creates a new `Behavior` instance, which is used to compare two
   * [Responses](https://developer.mozilla.org/en-US/docs/Web/API/Response)
   * and use the {@link https://developers.google.com/web/updates/2016/09/broadcastchannel|Broadcast Channel API}
   * to notify interested parties when those Responses differ.
   *
   * For efficiency's sake, the underlying response bodies are not compared;
   * only specific response headers are checked.
   *
   * @param {Object} input The input object to this function.
   * @param {string} input.channelName The name that will be used when creating
   *        the [`BroadcastChannel`](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel/BroadcastChannel).
   * @param {Array<string>} input.headersToCheck A list of headers that will be
   *        used to determine whether the `Response`s differ. If not provided,
   *        the values `['content-length', 'etag', 'last-modified']` are used.
   * @param {string} input.source An attribution value that will be used in the
   *        broadcast message to indicate where the update originated. If not
   *        provided, a
   *        {@link constants#defaultSource|default value} will be used.
   */
  constructor({channelName, headersToCheck, source}) {
    assert.isType({channelName}, 'string');

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
   * A "lifecycle" callback that will be triggered automatically by the
   * goog.runtimeCaching handlers when an entry is added to a cache.
   *
   * Developers would normally not call this method directly; instead,
   * [`notifyIfUpdated`](#notifyIfUpdated) provides equivalent functionality
   * with a slightly more efficient interface.
   *
   * @private
   * @param {Object} input The input object to this function.
   * @param {string} input.cacheName Name of the cache the Responses belong to.
   * @param {Response} [input.oldResponse] The previous cached value, if any.
   * @param {Response} input.newResponse The new value in the cache.
   */
  cacheDidUpdate({cacheName, oldResponse, newResponse}) {
    assert.isType({cacheName}, 'string');
    assert.isInstance({newResponse}, Response);

    if (oldResponse) {
      this.notifyIfUpdated({
        cacheName,
        first: oldResponse,
        second: newResponse}
      );
    }
  }

  /**
   * An explicit method to call from your own code to trigger the comparison of
   * two [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response)
   * and fire off a notification via the
   * {@link https://developers.google.com/web/updates/2016/09/broadcastchannel|Broadcast Channel API}
   * if they differ.
   *
   * @param {Object} input The input object to this function.
   * @param {Response} input.first One of the responses to compare.
   *        This should not be an {@link http://stackoverflow.com/questions/39109789|opaque response}.
   * @param {Response} input.second Another of the respones to compare.
   *        This should not be an {@link http://stackoverflow.com/questions/39109789|opaque response}.
   * @param {string} input.cacheName Name of the cache the Responses belong to.
   */
  notifyIfUpdated({first, second, cacheName}) {
    assert.isType({cacheName}, 'string');

    if (
      !responsesAreSame({first, second, headersToCheck: this.headersToCheck})) {
      broadcastUpdate({cacheName, url: second.url,
        channel: this.channel, source: this.source});
    }
  }
}

export default Behavior;
