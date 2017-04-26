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
 * # sw-background-sync-queue
 *
 * Queues failed requests and uses the Background Sync API to replay those
 * requests at a later time when the network state has changed.
 *
 * @module sw-background-sync-queue
 */
import {getResponse} from './lib/response-manager';
import {setDbName} from './lib/background-sync-idb-helper';
import BackgroundSyncQueue from './lib/background-sync-queue';
import {cleanupQueue} from './lib/queue-utils';
import assert from '../../../lib/assert';

/**
 * In order to use this library call `goog.backgroundSyncQueue.initialize()`.
 * It will take care of setting up IndexedDB for storing requests and broadcast
 * channel for communication of request creations. Also this attaches a handler
 * to `sync` event and replays the queued requeusts.
 *
 * @memberof module:sw-background-sync-queue
 *
 * @param {Object} [input] The input object to this function
 * @param {string} [input.dbName] The name of the db to store requests and
 * responses
 */
async function initialize({dbName} = {}) {
	if(dbName) {
		assert.isType({dbName}, 'string');
		setDbName(dbName);
	}
	await cleanupQueue();
}

export {
	initialize,
	getResponse,
	BackgroundSyncQueue,
};
