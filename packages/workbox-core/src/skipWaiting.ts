/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {logger} from './_private/logger.js';

import './_version.js';

// Give TypeScript the correct global.
declare let self: ServiceWorkerGlobalScope;

/**
 * This method is deprecated, and will be removed in Workbox v7.
 *
 * Calling self.skipWaiting() is equivalent, and should be used instead.
 *
 * @memberof module:workbox-core
 */
function skipWaiting(): void {
  // Just call self.skipWaiting() directly.
  // See https://github.com/GoogleChrome/workbox/issues/2525
  if (process.env.NODE_ENV !== 'production') {
    logger.warn(
      `skipWaiting() from workbox-core is no longer recommended ` +
        `and will be removed in Workbox v7. Using self.skipWaiting() instead ` +
        `is equivalent.`,
    );
  }

  void self.skipWaiting();
}

export {skipWaiting};
