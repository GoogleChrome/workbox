/*
  Copyright 2020 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
import {registerRoute} from 'workbox-routing/registerRoute.js';
import {StaleWhileRevalidate} from 'workbox-strategies/StaleWhileRevalidate.js';
import {CacheableResponsePlugin} from 'workbox-cacheable-response/CacheableResponsePlugin.js';
import {RouteMatchCallback, RouteMatchCallbackOptions} from 'workbox-core/types.js';

import './_version.js';

export interface StaticResourceOptions {
  cacheName?: string;
  matchCallback?: RouteMatchCallback;
}

/**
 * An implementation of the [CSS and JavaScript files recipe]{@link https://developers.google.com/web/tools/workbox/guides/common-recipes#cache_css_and_javascript_files}
 * 
 * @memberof module:workbox-recipes
 * 
 * @param {Object} [options]
 * @param {string} [options.cacheName] Name for cache. Defaults to static-resources
 */
function staticResourceCache(options: StaticResourceOptions = {}) {
  const defaultMatchCallback = ({request}: RouteMatchCallbackOptions) => request.destination === 'style' || request.destination === 'script' || request.destination === 'worker';

  const cacheName = options.cacheName || 'static-resources';
  const matchCallback = options.matchCallback || defaultMatchCallback;

  registerRoute(
    matchCallback,
    new StaleWhileRevalidate({
      cacheName,
      plugins: [
        new CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );
}

export { staticResourceCache }
