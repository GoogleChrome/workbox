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
 * # workbox-cache-expiration
 *
 * The cache expiration plugin allows you define an expiration and/or
 * limit on the responses cached.
 *
 * This can be used to ensure that responses aren't used when they are stale
 * and that the cache size doesn't grow endlessly.
 *
 * @example <caption>Used as an automatically invoked "plugin".</caption>
 *
 * // Add cache expiration plugin to `RequestWrapper`.
 * const requestWrapper = new goog.runtimeCaching.RequestWrapper({
 *   cacheName: 'runtime-cache',
 *   plugins: [
 *     // The cache size will be capped at 10 entries.
 *     new goog.cacheExpiration.Plugin({maxEntries: 10})
 *   ]
 * });
 *
 * // Add `RequestWrapper` to a runtime cache handler.
 * const route = new goog.routing.RegExpRoute({
 *   match: ({url}) => url.domain === 'example.com',
 *   handler: new goog.runtimeCaching.StaleWhileRevalidate({requestWrapper})
 * });
 *
 * @example <caption>To use the cache expiration as it's own module, you can
 * call the <code>expireEntries()</code> method to clean up the cache.</caption>
 * expirationPlugin.expireEntries({
 *   cacheName: 'example-cache-name'
 * });
 *
 * @module workbox-cache-expiration
 */

import {timestampPropertyName, urlPropertyName} from './lib/constants';
import CacheExpiration from './lib/cache-expiration';
import CacheExpirationPlugin from './lib/cache-expiration-plugin';

export {
  timestampPropertyName,
  urlPropertyName,
  CacheExpiration,
  CacheExpirationPlugin,
};
