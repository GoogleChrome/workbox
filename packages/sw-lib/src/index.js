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

/* eslint-env browser */

import ErrorFactory from './lib/error-factory';
import SWLib from './lib/sw-lib';
import assert from '../../../lib/assert.js';

if (!assert.isSWEnv()) {
  // We are not running in a service worker, print error message
  throw ErrorFactory.createError('not-in-sw');
}

/**
 * # sw-lib
 *
 * A high-level library that makes it easier to configure routes with
 * caching strategies as well as manage precaching
 * of assets during the install step of a service worker.
 *
 * @example <caption>Adding the Library to your project.</caption>
 * importScripts('/<Path to Module>/build/sw-lib.min.js');
 *
 * @example <caption>Caching assets and registering routes.</caption>
 *
 * goog.swlib.cacheRevisionedAssets([
 *   {
 *     url: '/',
 *     revision: '1234'
 *   },
 *   {
 *     url: '/styles/main.css',
 *     revision: 'abcd'
 *   }
 * ]);
 *
 * // Register runtime routes like so.
 * goog.swlib.router.registerRoute(
 *   '/example/', goog.swlib.staleWhileRevalidate());
 * goog.swlib.router.registerRoute(
 *   /\/images\/(.*\/)?.*\.(png|jpg|jpeg|gif)/, goog.swlib.cacheFirst());
 * goog.swlib.router.registerRoute(
 *   '/styles/:filename', goog.swlib.cacheFirst());
 *
 * @example <caption>Using plugins with caching strategies.</caption>
 *
 * goog.swlib.router.registerRoute(/\/images\/(.*\/)?.*\.(png|jpg|jpeg|gif)/,
 *   goog.swlib.cacheFirst({
 *     cacheName: 'example-cache',
 *     cacheExpiration: {
 *       maxEntries: 10,
 *       maxAgeSeconds: 7 * 24 * 60 * 60
 *     },
 *     cacheableResponse: {
 *       statuses: [0, 200]
 *     },
 *     broadcastCacheUpdate: {
 *       channelName: 'example-channel-name'
 *     },
 *     plugins: [
 *       // Additional Plugins
 *     ]
 *   })
 * );
 *
 * @module sw-lib
 */
const swLibInstance = new SWLib();
export default swLibInstance;
