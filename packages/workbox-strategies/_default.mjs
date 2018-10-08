/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {CacheFirst} from './CacheFirst.mjs';
import {CacheOnly} from './CacheOnly.mjs';
import {NetworkFirst} from './NetworkFirst.mjs';
import {NetworkOnly} from './NetworkOnly.mjs';
import {StaleWhileRevalidate} from './StaleWhileRevalidate.mjs';

import './_version.mjs';

/**
 * @function workbox.strategies.cacheFirst
 * @param {Object} options See the {@link workbox.strategies.CacheFirst}
 * constructor for more info.
 */

/**
 * @function workbox.strategies.cacheOnly
 * @param {Object} options See the {@link workbox.strategies.CacheOnly}
 * constructor for more info.
 */

/**
 * @function workbox.strategies.networkFirst
 * @param {Object} options See the {@link workbox.strategies.NetworkFirst}
 * constructor for more info.
 */

/**
 * @function workbox.strategies.networkOnly
 * @param {Object} options See the {@link workbox.strategies.NetworkOnly}
 * constructor for more info.
 */

/**
 * @function workbox.strategies.staleWhileRevalidate
 * @param {Object} options See the
 * {@link workbox.strategies.StaleWhileRevalidate} constructor for more info.
 */

const mapping = {
  cacheFirst: CacheFirst,
  cacheOnly: CacheOnly,
  networkFirst: NetworkFirst,
  networkOnly: NetworkOnly,
  staleWhileRevalidate: StaleWhileRevalidate,
};

const defaultExport = {};
Object.keys(mapping).forEach((keyName) => {
  defaultExport[keyName] = (options = {}) => {
    const StrategyClass = mapping[keyName];
    return new StrategyClass(
        Object.assign(options)
    );
  };
});

export default defaultExport;
