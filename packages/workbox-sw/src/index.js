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

import SWLib from './lib/sw-lib';

/**
 * # sw-lib
 *
 * A high-level library that makes it easier to configure routes with
 * caching strategies as well as manage precaching
 * of assets during the install step of a service worker.
 *
 * @example <caption>Adding the Library to your project.</caption>
 * importScripts('/<Path to Module>/build/importScripts/sw-lib.prod.vX.Y.Z.js');
 *
 * @example <caption>Caching assets and registering routes.</caption>
 *
 * // DO NOT CREATE THIS MANIFEST OR EDIT IT MANUALLY!!
 * // Use sw-build or sw-cli to generate the manifest for you.
 * const swlib = new goog.SWLib();
 * swlib.precache([
 *   {
 *     url: '/',
 *     revision: '613e6c7332dd83e848a8b00c403827ed'
 *   },
 *   {
 *     url: '/styles/main.css',
 *     revision: '59a325f32baad11bd47a8c515ec44ae5'
 *   }
 * ]);
 *
 * // Register runtime routes like so.
 * swlib.router.registerRoute(
 *   '/example/', swlib.staleWhileRevalidate());
 * swlib.router.registerRoute(
 *   /\/images\/(.*\/)?.*\.(png|jpg|jpeg|gif)/,
 *   swlib.strategies.cacheFirst());
 * swlib.router.registerRoute(
 *   '/styles/:filename', swlib.strategies.cacheFirst());
 *
 * @example <caption>Using plugins with caching strategies.</caption>
 * const swlib = new goog.SWLib();
 * swlib.router.registerRoute(/\/images\/(.*\/)?.*\.(png|jpg|jpeg|gif)/,
 *   swlib.strategies.cacheFirst({
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
export default SWLib;
