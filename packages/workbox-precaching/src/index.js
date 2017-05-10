/*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

/**
 * # workbox-precaching
 *
 * The precaching module provides helpers that make it easy to cache files
 * during the install step of your service worker.
 *
 * The revisioned caching will cache bust requests where appropriate and
 * only cache assets that have a changed revision asset compared to
 * the currently cached value.
 *
 * @example
 * importScripts('/<Path to Module>/build/workbox-precaching.min.js');
 *
 * const revCacheManager = new goog.precaching.RevisionedCacheManager();
 * revCacheManager.addToCacheList({
 *   revisionedFiles: [
 *     '/styles/main.1234.css',
 *     {
 *       url: '/',
 *       revision: '1234'
 *     }
 *   ],
 * });
 *
 * const unrevCacheManager = new goog.precaching.UnrevisionedCacheManager();
 * unrevCacheManager.addToCacheList({
 *   unrevisionedFiles: [
 *     '/',
 *     '/images/logo.png'
 *   ]
 * });
 *
 * self.addEventListener('install', (event) => {
 *   const promiseChain = Promise.all([
 *     revCacheManager.install(),
 *     unrevCacheManager.install(),
 *   ]);
 *   event.waitUntil(promiseChain);
 * });
 *
 * self.addEventListener('activate', (event) => {
 *   const promiseChain = Promise.all([
 *     revCacheManager.cleanup(),
 *     unrevCacheManager.cleanup()
 *   ]);
 *   event.waitUntil(promiseChain);
 * });
 *
 * @module workbox-precaching
 */
import ErrorFactory from './lib/error-factory';
import RevisionedCacheManager from
  './lib/controllers/revisioned-cache-manager.js';
import UnrevisionedCacheManager from
  './lib/controllers/unrevisioned-cache-manager.js';

import environment from '../../../lib/environment.js';

if (!environment.isServiceWorkerGlobalScope()) {
  // We are not running in a service worker, print error message
  throw ErrorFactory.createError('not-in-sw');
}

export {
  RevisionedCacheManager,
  UnrevisionedCacheManager,
};
