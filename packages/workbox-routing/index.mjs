/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import defaultExport from './_default.mjs';
import './_version.mjs';

/**
 * @namespace workbox.routing
 * @borrows workbox.routing.Router#setCatchHandler as setCatchHandler
 * @borrows workbox.routing.Router#setDefaultHandler as setDefaultHandler
 * @borrows workbox.routing.Router#unregisterRoute as unregisterRoute
 */

export * from './_public.mjs';
export default defaultExport;
