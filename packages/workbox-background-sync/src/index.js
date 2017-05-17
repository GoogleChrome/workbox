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

Queues failed requests and uses the
 +[Background Sync API](https://developers.google.com/web/updates/2015/12/background-sync)
 +to replay them when the network is available.

/**
 * # workbox-background-sync
 *
 * A library to queue failed requests and use the
 * [Background Sync API](https://developers.google.com/web/updates/2015/12/background-sync)
 * to replay those requests when the network is available.
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
