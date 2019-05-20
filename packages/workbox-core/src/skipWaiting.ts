/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import './_version.mjs';


/**
 * Force a service worker to become active, instead of waiting. This is
 * normally used in conjunction with `clientsClaim()`.
 *
 * @alias workbox.core.skipWaiting
 */
export const skipWaiting = () => {
  // We need to explicitly call `self.skipWaiting()` here because we're
  // shadowing `skipWaiting` with this local function.
  addEventListener('install', () => self.skipWaiting());
};
