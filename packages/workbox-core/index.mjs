/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {registerQuotaErrorCallback} from './_private/quota.mjs';
import * as _private from './_private.mjs';
import defaultExport from './_default.mjs';
import LOG_LEVELS from './models/LogLevels.mjs';

import './_version.mjs';

/**
 * All of the Workbox service worker libraries use workbox-core for shared
 * code as well as setting default values that need to be shared (like cache
 * names).
 *
 * @namespace workbox.core
 */

/**
 * Utilities that are shared with other Workbox modules.
 *
 * @alias workbox.core._private
 * @private
 */

export {
  _private,
  LOG_LEVELS,
  registerQuotaErrorCallback,
};

export default defaultExport;
