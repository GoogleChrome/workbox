/*
  Copyright 2017 Google Inc.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import './_version.mjs';

/**
 * @typedef {Object} StrategyOptions
 * @property {String} cacheName Name of cache to use
 * for caching (both lookup and updating).
 * @property {Object} cacheExpiration Defining this
 * object will add a cache expiration plugins to this strategy.
 * @property {Number} cacheExpiration.maxEntries
 * The maximum number of entries to store in a cache.
 * @property {Number} cacheExpiration.maxAgeSeconds
 * The maximum lifetime of a request to stay in the cache before it's removed.
 * @memberof workbox.strategies
 */
