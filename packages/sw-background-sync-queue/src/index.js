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
 * sw-background-sync-queue Module
 *
 * @module sw-background-sync-queue
 */

import RequestManager from './lib/request-manager';
import {initiazileBroadcastManager} from './lib/broadcast-manager';
import {getResponse} from './lib/response-manager';
import {initDb} from './lib/background-sync-idb-helper';

let reqManager;
/**
 * Initialize the library by initializing broadcast manager,
 * indexedDB, and request manager
 * @param {Object=} config
 * @param {Object=} callbacks
 * @param {Object=} broadcastChannel
 * @param {Object=} dbname
 */
function initialize({config, callbacks, broadcastChannel, dbName}) {
	initiazileBroadcastManager(broadcastChannel);
	initDb(dbName);
	reqManager = new RequestManager({config, callbacks});
	reqManager.initialize();
}

/**
 * pushes the given request inthe backgroun sync queue
 *
 * @param {Request=} request
 * @param {Object=} config
 */
function pushIntoQueue({request, config}) {
	reqManager.pushIntoQueue({request, config});
}

export {initialize, pushIntoQueue, getResponse};
