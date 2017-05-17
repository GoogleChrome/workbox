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
 * # workbox-background-sync
 *
 * A helper library that queues specified requests if they fail over network.
 * Later it uses the Background Sync API to replay these queued requests
 * when the network state has changed.
 *
 * The main use of this module will be instantiating a new
 * `Queue`/`QueuePlugin` and passing it to a
 * {@link module:workbox-runtime-caching.RequestWrapper|RequestWrapper},
 * as shown in the first example below.
 *
 * @example <caption>Using the QueuePlugin class in a service worker.</caption>
 *
 * let bgQueue = new workbox.backgroundSync.QueuePlugin();
 * const requestWrapper = new workbox.runtimeCaching.RequestWrapper({
 *   plugins: [bgQueue],
 * });
 *
 * const route = new workbox.routing.RegExpRoute({
 *   regExp: new RegExp('^http://localhost:3000/__echo/counter'),
 *   handler: new workbox.runtimeCaching.NetworkOnly({requestWrapper}),
 * });
 *
 * const router = new workbox.routing.Router();
 * router.registerRoute({route});
 *
 * **Install:** `npm install --save-dev workbox-background-sync`
 *
 * @module workbox-background-sync
 */
import Queue from './lib/background-sync-queue';
import QueuePlugin from './lib/background-sync-queue-plugin';

export {
	Queue,
	QueuePlugin,
};
