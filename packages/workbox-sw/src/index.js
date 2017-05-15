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

import WorkboxSW from './lib/workbox-sw';

/**
 * # workbox-sw
 *
 * A high-level library that makes it easier to configure routes with
 * caching strategies as well as manage precaching
 * of assets during the install step of a service worker.
 *
 * **Install:** `npm install --save-dev workbox-sw`
 *
 * @example <caption>Adding the Library to your project.</caption>
 * importScripts('/node_modules/build/importScripts/workbox-sw.prod.vX.Y.Z.js');
 *
 * @example <caption>Caching assets and registering routes.</caption>
 *
 * // DO NOT CREATE THIS MANIFEST OR EDIT IT MANUALLY!!
 * // Use workbox-build or workbox-cli to generate the manifest for you.
 * const workboxSW = new WorkboxSW();
 * workboxSW.precache([
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
 * workboxSW.router.registerRoute(
 *   '/example/', workboxSW.staleWhileRevalidate());
 * workboxSW.router.registerRoute(
 *   /\/images\/(.*\/)?.*\.(png|jpg|jpeg|gif)/,
 *   workboxSW.strategies.cacheFirst());
 * workboxSW.router.registerRoute(
 *   '/styles/:filename', workboxSW.strategies.cacheFirst());
 *
 * @example <caption>Using plugins with caching strategies.</caption>
 * const workboxSW = new WorkboxSW();
 * workboxSW.router.registerRoute(/\/images\/(.*\/)?.*\.(png|jpg|jpeg|gif)/,
 *   workboxSW.strategies.cacheFirst({
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
 * @module workbox-sw
 */
export default WorkboxSW;
