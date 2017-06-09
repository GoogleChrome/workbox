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

import BroadcastCacheUpdate from './broadcast-cache-update';
import {isType, isInstance} from '../../../../lib/assert';

/**
 * Can be used to compare two [Responses](https://developer.mozilla.org/en-US/docs/Web/API/Response)
 * and uses the {@link https://developers.google.com/web/updates/2016/09/broadcastchannel|Broadcast Channel API}
 * to notify interested parties when those responses differ.
 *
 * For efficiency's sake, the underlying response bodies are not compared;
 * only specific response headers are checked.
 *
 * This class is meant to be automatically invoked as a plugin by a
 * {@link module:workbox-runtime-caching.RequestWrapper|RequestWrapper}, which
 * is used by the `workbox-sw` and `workbox-runtime-caching` modules.
 *
 * If you would like to use this functionality outside of the `RequestWrapper`
 * context, please use the
 * [BroadcastCacheUpdate]{@link
 *  module:workbox-broadcast-cache-update.BroadcastCacheUpdate}
 * class directly.
 *
 * @example <caption>Add a BroadcastCacheUpdatePlugin to a `RequestWrapper` to
 * dispatch messages on a cache update.</caption>
 *
 * const requestWrapper = new workbox.runtimeCaching.RequestWrapper({
 *   cacheName: 'runtime-cache',
 *   plugins: [
 *     new workbox.broadcastCacheUpdate.Plugin({channelName: 'cache-updates'})
 *   ]
 * });
 * const route = new workbox.routing.RegExpRoute({
 *   match: ({url}) => url.domain === 'example.com',
 *   handler: new workbox.runtimeCaching.StaleWhileRevalidate({requestWrapper})
 * });
 *
 * @memberof module:workbox-broadcast-cache-update
 */
class BroadcastCacheUpdatePlugin extends BroadcastCacheUpdate {
  /**
   * A "lifecycle" callback that will be triggered automatically by the
   * `workbox-sw` and `workbox-runtime-caching` handlers when an entry is
   * added to a cache.
   *
   * @private
   * @param {Object} input The input object to this function.
   * @param {string} input.cacheName Name of the cache the responses belong to.
   * @param {Response} [input.oldResponse] The previous cached value, if any.
   * @param {Response} input.newResponse The new value in the cache.
   * @param {string} input.url The cache key URL.
   */
  cacheDidUpdate({cacheName, oldResponse, newResponse, url}) {
    isType({cacheName}, 'string');
    isInstance({newResponse}, Response);

    if (oldResponse) {
      this.notifyIfUpdated({
        cacheName,
        first: oldResponse,
        second: newResponse,
        url,
      });
    }
  }
}

export default BroadcastCacheUpdatePlugin;
