/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {registerQuotaErrorCallback} from './registerQuotaErrorCallback';
import * as _private from './_private';
import {
  WorkboxError,
  logger,
  assert,
  getFriendlyURL,
  timeout,
  resultingClientExists,
  dontWaitFor,
  Deferred,
  cacheNames as privateCacheNames,
  cacheMatchIgnoreParams,
  executeQuotaErrorCallbacks,
  waitUntil,
  canConstructReadableStream,
} from './_private';
import {cacheNames} from './cacheNames';
import {copyResponse} from './copyResponse';
import {clientsClaim} from './clientsClaim';
import {setCacheNameDetails} from './setCacheNameDetails';
import {skipWaiting} from './skipWaiting';
import './_version';

export * from './types';
import {CacheDidUpdateCallbackParam, WorkboxPlugin} from './types';

/**
 * All of the Workbox service worker libraries use workbox-core for shared
 * code as well as setting default values that need to be shared (like cache
 * names).
 *
 * @module workbox-core
 */
export {
  _private,
  cacheNames,
  Deferred,
  privateCacheNames,
  clientsClaim,
  copyResponse,
  dontWaitFor,
  registerQuotaErrorCallback,
  setCacheNameDetails,
  skipWaiting,
  WorkboxError,
  logger,
  assert,
  getFriendlyURL,
  timeout,
  resultingClientExists,
  CacheDidUpdateCallbackParam,
  cacheMatchIgnoreParams,
  executeQuotaErrorCallbacks,
  WorkboxPlugin,
  waitUntil,
  canConstructReadableStream,
};
