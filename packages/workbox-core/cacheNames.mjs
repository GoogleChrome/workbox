/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {cacheNames as _cacheNames} from './_private/cacheNames.mjs';
import './_version.mjs';


/**
 * Get the current cache names and prefix/suffix used by Workbox.
 *
 * `cacheNames.precache` is used for precached assets,
 * `cacheNames.googleAnalytics` is used by `workbox-google-analytics` to
 * store `analytics.js`, and `cacheNames.runtime` is used for everything else.
 *
 * `cacheNames.prefix` can be used to retrieve just the current prefix value.
 * `cacheNames.suffix` can be used to retrieve just the current suffix value.
 *
 * @return {Object} An object with `precache`, `runtime`, `prefix`, and
 *     `googleAnalytics` properties.
 *
 * @alias workbox.core.cacheNames
 */
export const cacheNames = {
  get googleAnalytics() {
    return _cacheNames.getGoogleAnalyticsName();
  },
  get precache() {
    return _cacheNames.getPrecacheName();
  },
  get prefix() {
    return _cacheNames.getPrefix();
  },
  get runtime() {
    return _cacheNames.getRuntimeName();
  },
  get suffix() {
    return _cacheNames.getSuffix();
  },
};
