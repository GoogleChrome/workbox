/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {logger} from 'workbox-core/_private/logger.mjs';
import {CacheFirst} from './CacheFirst.mjs';
import {CacheOnly} from './CacheOnly.mjs';
import {NetworkFirst} from './NetworkFirst.mjs';
import {NetworkOnly} from './NetworkOnly.mjs';
import {StaleWhileRevalidate} from './StaleWhileRevalidate.mjs';
import './_version.mjs';


const mapping = {
  cacheFirst: CacheFirst,
  cacheOnly: CacheOnly,
  networkFirst: NetworkFirst,
  networkOnly: NetworkOnly,
  staleWhileRevalidate: StaleWhileRevalidate,
};

const deprecate = (strategy) => {
  const StrategyCtr = mapping[strategy];

  return (options) => {
    if (process.env.NODE_ENV !== 'production') {
      const strategyCtrName = strategy[0].toUpperCase() + strategy.slice(1);
      logger.warn(`The 'workbox.strategies.${strategy}()' function has been ` +
          `deprecated and will be removed in a future version of Workbox.\n` +
          `Please use 'new workbox.strategies.${strategyCtrName}()' instead.`);
    }
    return new StrategyCtr(options);
  };
};

/**
 * @function workbox.strategies.cacheFirst
 * @param {Object} options See the {@link workbox.strategies.CacheFirst}
 * constructor for more info.
 * @deprecated since v4.0.0
 */
const cacheFirst = deprecate('cacheFirst');

/**
 * @function workbox.strategies.cacheOnly
 * @param {Object} options See the {@link workbox.strategies.CacheOnly}
 * constructor for more info.
 * @deprecated since v4.0.0
 */
const cacheOnly = deprecate('cacheOnly');

/**
 * @function workbox.strategies.networkFirst
 * @param {Object} options See the {@link workbox.strategies.NetworkFirst}
 * constructor for more info.
 * @deprecated since v4.0.0
 */
const networkFirst = deprecate('networkFirst');

/**
 * @function workbox.strategies.networkOnly
 * @param {Object} options See the {@link workbox.strategies.NetworkOnly}
 * constructor for more info.
 * @deprecated since v4.0.0
 */
const networkOnly = deprecate('networkOnly');

/**
 * @function workbox.strategies.staleWhileRevalidate
 * @param {Object} options See the
 * {@link workbox.strategies.StaleWhileRevalidate} constructor for more info.
 * @deprecated since v4.0.0
 */
const staleWhileRevalidate = deprecate('staleWhileRevalidate');

/**
 * There are common caching strategies that most service workers will need
 * and use. This module provides simple implementations of these strategies.
 *
 * @namespace workbox.strategies
 */

export {
  CacheFirst,
  CacheOnly,
  NetworkFirst,
  NetworkOnly,
  StaleWhileRevalidate,

  // Deprecated...
  cacheFirst,
  cacheOnly,
  networkFirst,
  networkOnly,
  staleWhileRevalidate,
};

