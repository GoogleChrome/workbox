/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {cacheNames} from './_private/cacheNames.mjs';
import './_version.mjs';


/**
 * Get the current cache names used by Workbox.
 *
 * `cacheNames.precache` is used for precached assets,
 * `cacheNames.googleAnalytics` is used by `workbox-google-analytics` to
 * store `analytics.js`, and `cacheNames.runtime` is used for everything else.
 *
 * @return {Object} An object with `precache`, `runtime`, and
 *     `googleAnalytics` cache names.
 *
 * @alias workbox.core.cacheNames
 */
export const getCacheNames = {
  googleAnalytics: cacheNames.getGoogleAnalyticsName(),
  precache: cacheNames.getPrecacheName(),
  runtime: cacheNames.getRuntimeName(),
};
