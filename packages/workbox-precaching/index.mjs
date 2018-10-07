/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import defaultPrecachingExport from './_default.mjs';
import './_version.mjs';

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

export * from './_public.mjs';

export default defaultPrecachingExport;
