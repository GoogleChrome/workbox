/*
  Copyright 2020 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
import {registerRoute} from 'workbox-routing/registerRoute.js';
import {CacheFirst} from 'workbox-strategies/CacheFirst.js';
import {CacheableResponsePlugin} from 'workbox-cacheable-response/CacheableResponsePlugin.js';
import {ExpirationPlugin} from 'workbox-expiration/ExpirationPlugin.js';
import {RouteMatchCallback, RouteMatchCallbackOptions} from 'workbox-core/types.js';

import './_version.js';

export interface ImageCacheOptions {
  cacheName?: string;
  matchCallback?: RouteMatchCallback;
  maxAgeSeconds?: number;
  maxEntries?: number;
}

/**
 * An implementation of the [image caching recipe]{@link https://developers.google.com/web/tools/workbox/guides/common-recipes#caching_images}
 * 
 * @memberof module:workbox-recipes
 * 
 * @param {Object} [options]
 * @param {string} [options.cacheName] Name for cache. Defaults to images
 * @param {number} [options.maxAgeSeconds] Maximum age, in seconds, that font entries will be cached for. Defaults to 30 days
 * @param {number} [options.maxEntries] Maximum number of images that will be cached. Defaults to 60
 */
function imageCache(options: ImageCacheOptions = {}) {
  const defaultMatchCallback = ({request}: RouteMatchCallbackOptions) => request.destination === 'image';

  const cacheName = options.cacheName || 'images';
  const matchCallback = options.matchCallback || defaultMatchCallback;
  const maxAgeSeconds = options.maxAgeSeconds || 30 * 24 * 60 * 60;
  const maxEntries = options.maxEntries || 60;

  registerRoute(
    matchCallback,
    new CacheFirst({
      cacheName,
      plugins: [
        new CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new ExpirationPlugin({
          maxEntries,
          maxAgeSeconds
        }),
      ],
    })
  );
}

export { imageCache }
