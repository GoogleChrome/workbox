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
 * The precaching library intelligently caches and updates files
 * during the install step of your service worker.
 *
 * When given a list of URL's to precache, this module will go through
 * each URL and check if the URL is already cached and, if it is, compare
 * the hash to see if revision hash has changed.
 *
 * If the revision is old or the entry isn't cached, this library will make
 * a request for the asset and cache it, ensuring the the browsers HTTP cache
 * is skipped by using `Request.cache = 'reload'` or adding a cache busting
 * search parameter to the request.
 *
 * @example
 * importScripts('/<Path to Module>/build/workbox-precaching.min.js');
 *
 * const revCacheManager = new workbox.precaching.RevisionedCacheManager();
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
 * self.addEventListener('install', (event) => {
 *   event.waitUntil(
 *     revCacheManager.install()
 *   );
 * });
 *
 * self.addEventListener('activate', (event) => {
 *   event.waitUntil(
 *     revCacheManager.cleanup()
 *   );
 * });
 *
 * @module workbox-precaching
 */
import RevisionedCacheManager from
  './lib/controllers/revisioned-cache-manager.js';

import WorkboxError from '../../../lib/workbox-error';
import {isServiceWorkerGlobalScope} from '../../../lib/environment.js';

if (!isServiceWorkerGlobalScope()) {
  // We are not running in a service worker, print error message
  throw new WorkboxError('not-in-sw');
}

export {
  RevisionedCacheManager,
};
