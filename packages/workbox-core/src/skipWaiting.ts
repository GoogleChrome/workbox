/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import './_version.js';


// Give TypeScript the correct global.
declare var self: ServiceWorkerGlobalScope;

/**
 * Force a service worker to activate immediately, instead of
 * [waiting](https://developers.google.com/web/fundamentals/primers/service-workers/lifecycle#waiting)
 * for existing clients to close.
 *
 * @alias workbox.core.skipWaiting
 */
export const skipWaiting = () => {
  // We need to explicitly call `self.skipWaiting()` here because we're
  // shadowing `skipWaiting` with this local function.
  addEventListener('install', () => self.skipWaiting());
};
