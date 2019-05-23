/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {registerQuotaErrorCallback} from './registerQuotaErrorCallback';
import * as _private from './_private';
import {clientsClaim} from './clientsClaim';
import {cacheNames} from './cacheNames';
import {setCacheNameDetails} from './setCacheNameDetails';
import {skipWaiting} from './skipWaiting';
import './_version';


/**
 * All of the Workbox service worker libraries use workbox-core for shared
 * code as well as setting default values that need to be shared (like cache
 * names).
 *
 * @namespace workbox.core
 */
export {
  _private,
  clientsClaim,
  cacheNames,
  registerQuotaErrorCallback,
  setCacheNameDetails,
  skipWaiting,
};
