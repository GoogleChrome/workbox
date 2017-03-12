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

/**
 * # sw-broadcast-cache-update
 *
 * A helper library that uses the Broadcast Channel API to announce when
 * two Response objects differ.
 *
 * The main use of this module will be instantiating a new
 * `BroadcastCacheUpdatePlugin` and passing it to a
 * {@link module:sw-runtime-caching.RequestWrapper|RequestWrapper},
 * as shown in the first example below.
 *
 * You can listen for updates from your web app by adding an event listener on
 * a `BroadcastChannel` within a page, using the same channel name as
 * what's used within the service worker, as shown in the second example below.
 *
 * @example <caption>Using the BroadcastCacheUpdatePlugin class in a
 * service worker.</caption>
 *
 * const requestWrapper = new goog.runtimeCaching.RequestWrapper({
 *   cacheName: 'text-files',
 *   plugins: [
 *     new goog.broadcastCacheUpdate.BroadcastCacheUpdatePlugin(
 *       {channelName: 'cache-updates'})
 *   ],
 * });
 *
 * const route = new goog.routing.RegExpRoute({
 *   regExp: /\.txt$/,
 *   handler: new goog.runtimeCaching.StaleWhileRevalidate({requestWrapper}),
 * });
 *
 * const router = new goog.routing.Router();
 * router.registerRoute({route});
 *
 * @example <caption>Listening for the broadcast message in the
 * window.</caption>
 *
 * const updateChannel = new BroadcastChannel('cache-updates');
 * updateChannel.addEventListener('message', event => {
 *   console.log(`Cache updated: ${event.data.payload.updatedUrl}`);
 * });
 *
 * @module sw-broadcast-cache-update
 */

import BroadcastCacheUpdate from './lib/broadcast-cache-update';
import BroadcastCacheUpdatePlugin from './lib/broadcast-cache-update-plugin';
import broadcastUpdate from './lib/broadcast-update';
import {cacheUpdatedMessageType} from './lib/constants';
import responsesAreSame from './lib/responses-are-same';

export {
  BroadcastCacheUpdate,
  BroadcastCacheUpdatePlugin,
  broadcastUpdate,
  cacheUpdatedMessageType,
  responsesAreSame,
};
