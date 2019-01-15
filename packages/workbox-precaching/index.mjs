/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {assert} from 'workbox-core/_private/assert.mjs';
import {addPlugins} from './addPlugins.mjs';
import {addRoute} from './addRoute.mjs';
import {cleanupOutdatedCaches} from './cleanupOutdatedCaches.mjs';
import {getCacheKeyForURL} from './getCacheKeyForURL.mjs';
import {precache} from './precache.mjs';
import {precacheAndRoute} from './precacheAndRoute.mjs';
import {PrecacheController} from './PrecacheController.mjs';
import './_version.mjs';


if (process.env.NODE_ENV !== 'production') {
  assert.isSWEnv('workbox-precaching');
}

/**
 * Most consumers of this module will want to use the
 * [precacheAndRoute()]{@link workbox.precaching.precacheAndRoute}
 * method to add assets to the Cache and respond to network requests with these
 * cached assets.
 *
 * If you require finer grained control, you can use the
 * [PrecacheController]{@link workbox.precaching.PrecacheController}
 * to determine when performed.
 *
 * @namespace workbox.precaching
 */

export {
  addPlugins,
  addRoute,
  cleanupOutdatedCaches,
  getCacheKeyForURL,
  precache,
  precacheAndRoute,
  PrecacheController,
};
