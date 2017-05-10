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
 * # workbox-cacheable-response
 *
 * Given a Response object this behaviour determines whether
 * it's cacheable, based on a specific configuration.
 *
 * @example <caption>Used as an automatically invoked
 * "plugin".</caption>
 *
 * // The responses will be cached if the response code is 0, 200, or 404, and
 * // will not be cached otherwise.
 * const cacheablePlugin = new goog.cacheableResponse.Plugin({
 *   statuses: [0, 200, 404]
 * });
 *
 * const requestWrapper = new goog.runtimeCaching.RequestWrapper({
 *   cacheName: 'runtime-cache',
 *   plugins: [
 *     cacheablePlugin
 *   ]
 * });
 *
 * const route = new goog.routing.RegExpRoute({
 *   match: ({url}) => url.domain === 'example.com',
 *   handler: new goog.runtimeCaching.StaleWhileRevalidate({requestWrapper})
 * });
 *
 * @module workbox-cacheable-response
 */

import CacheableResponse from './lib/cacheable-response';
import CacheableResponsePlugin from './lib/cacheable-response-plugin';

export {
  CacheableResponse,
  CacheableResponsePlugin,
};
