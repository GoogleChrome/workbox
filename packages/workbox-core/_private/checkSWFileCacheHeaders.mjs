/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {logger} from './logger.mjs';
import '../_version.mjs';

/**
 * Logs a warning to the user recommending changing
 * to max-age=0 or no-cache.
 *
 * @param {string} cacheControlHeader
 *
 * @private
 */
function showWarning(cacheControlHeader) {
  const docsURL = 'https://developers.google.com/web/tools/workbox/guides/service-worker-checklist#cache-control_of_your_service_worker_file';
  logger.warn(`You are setting a 'cache-control' header of ` +
    `'${cacheControlHeader}' on your service worker file. This should be ` +
    `set to 'max-age=0' or 'no-cache' to ensure the latest service worker ` +
    `is served to your users. Learn more here: ${docsURL}`
  );
}

/**
 * Checks for cache-control header on SW file and
 * warns the developer if it exists with a value
 * other than max-age=0 or no-cache.
 *
 * @return {Promise}
 * @private
 */
function checkSWFileCacheHeaders() {
  // This is wrapped as an iife to allow async/await while making
  //  rollup exclude it in builds.
  return (async () => {
    try {
      const swFile = self.location.href;
      const response = await fetch(swFile);
      if (!response.ok) {
        // Response failed so nothing we can check;
        return;
      }

      if (!response.headers.has('cache-control')) {
        // No cache control header.
        return;
      }

      const cacheControlHeader = response.headers.get('cache-control');
      const maxAgeResult = /max-age\s*=\s*(\d*)/g.exec(cacheControlHeader);
      if (maxAgeResult) {
        if (parseInt(maxAgeResult[1], 10) === 0) {
          return;
        }
      }

      if (cacheControlHeader.indexOf('no-cache') !== -1) {
        return;
      }

      if (cacheControlHeader.indexOf('no-store') !== -1) {
        return;
      }

      showWarning(cacheControlHeader);
    } catch (err) {
      // NOOP
    }
  })();
}

const finalCheckSWFileCacheHeaders =
  process.env.NODE_ENV === 'production' ? null : checkSWFileCacheHeaders;

export {finalCheckSWFileCacheHeaders as checkSWFileCacheHeaders};
