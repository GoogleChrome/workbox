/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import '../_version.mjs';

const _cacheNameDetails = {
  prefix: 'workbox',
  suffix: self.registration.scope,
  googleAnalytics: 'googleAnalytics',
  precache: 'precache',
  runtime: 'runtime',
};

const _createCacheName = (cacheName) => {
  return [_cacheNameDetails.prefix, cacheName, _cacheNameDetails.suffix]
      .filter((value) => value.length > 0)
      .join('-');
};

const cacheNames = {
  updateDetails: (details) => {
    Object.keys(_cacheNameDetails).forEach((key) => {
      if (typeof details[key] !== 'undefined') {
        _cacheNameDetails[key] = details[key];
      }
    });
  },
  getGoogleAnalyticsName: (userCacheName) => {
    return userCacheName || _createCacheName(_cacheNameDetails.googleAnalytics);
  },
  getPrecacheName: (userCacheName) => {
    return userCacheName || _createCacheName(_cacheNameDetails.precache);
  },
  getRuntimeName: (userCacheName) => {
    return userCacheName || _createCacheName(_cacheNameDetails.runtime);
  },
};

export {cacheNames};
