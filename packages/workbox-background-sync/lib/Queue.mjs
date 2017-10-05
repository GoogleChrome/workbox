/*
 Copyright 2017 Google Inc. All Rights Reserved.
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

import {_private} from 'workbox-core';
import serializeRequest from './serialize-request.mjs';


const {indexedDBHelper, WorkboxError} = _private;
const names = new Set();


const DB_NAME = 'workbox-background-sync';
const TAG_PREFIX = 'workbox-background-sync';
const OBJECT_STORE_NAME = 'requests';


/**
 * Use the instance of this class to push the failed requests into the queue.
 *
 * @example
 * When you want to push the requests manually
 * let bgQueue = new workbox.backgroundSync.Queue();
 * self.addEventListener('fetch', function(e) {
 *   if (!e.request.url.startsWith('https://jsonplaceholder.typicode.com')) {
 *     return;
 *   }
 *
 *   const clone = e.request.clone();
 *   e.respondWith(fetch(e.request).catch((err) => {
 *     bgQueue.pushIntoQueue({
 *       request: clone,
 *     });
 *     throw err;
 *   }));
 * });
 *
 * @memberof module:workbox-background-sync
 */
export default class Queue {
  /**
   * Creates an instance of Queue with the given name and config options
   *
   * @param {string} name
   * @param {Object} [input]
   * @param {number} [input.maxRetentionTime = 5 days] Time for which a queued
   *     request will live in the queue(irrespective of failed/success of
   *     replay).
   * @param {Object} [input.callbacks] Callbacks for successfull/failed
   *     replay of a request as well as modifying before enqueue/dequeue-ing.
   * @param {Fuction} [input.callbacks.replayDidSucceed] Invoked with params
   *     (hash:string, response:Response) after a request is successfully
   *     replayed.
   * @param {Fuction<string>} [input.callbacks.replayDidFail] Invoked with
   *     param (hash:string) after a replay attempt has failed.
   * @param {Fuction<Object>} [input.callbacks.requestWillEnqueue] Invoked with
   *     param (reqData:Object) before a failed request is saved to the queue.
   *     Use this to modify the saved data.
   * @param {Fuction<Object>} [input.callbacks.requestWillDequeue] Invoked with
   *     param (reqData:Object) before a failed request is retrieved from the
   *     queue. Use this to modify the data before the request is replayed.
   * XXX@param {BroadcastChannel=} [input.broadcastChannel] BroadcastChannel
   *     which will be used to publish messages when the request will be queued.
   */
  constructor(name, {
    // broadcastChannel,
    callbacks,
    // maxRetentionTime = maxAge,
  } = {}) {
    // Ensure the store name is not already being used
    if (names.has(name)) {
      throw new WorkboxError('duplicate-queue-name', {name});
    }
    names.add(name);
    this._name = name;

    this._addSyncListener();
  }

  /**
   * Stores the passed request into IndexedDB. The database used is
   * `workbox-background-sync` and the object store name is the same as
   * the name this instance was created with (to guarantee it's unique).
   *
   * @param {Request} request The request object to store.
   */
  async addRequest(request) {
    const requestData = await serializeRequest(request);
    const db = await this._getDb();

    await db.add({
      queueName: this._name,
      url: request.url,
      timestamp: Date.now(),
      requestData,
    });

    // Schedule this, but don't await it as we don't want to block subsequent
    // calls if the service worker isn't yet activated.
    this._registerSync();
  }

  /**
   * Retrieves all stored requests in IndexedDB and retries them.
   * If the retry fails, they're re-added to the queue.
   */
  async replayRequests() {
    const requestsInQueue = await this.getRequestsInQueue();

    for (const [key, value] of requestsInQueue) {
      await this._replayRequest(key, value);
    }
  }

  /**
   * Gets all requests in the object store matching this queue's name.
   * @return {Promise<Array>}
   */
  async getRequestsInQueue() {
    const db = await this._getDb();

    return [...(await db.getAll()).entries()]
        .filter(([key, value]) => value.queueName == this._name);
  }

  /**
   * @return {Promise<DBWrapper>}
   */
  _getDb() {
    return indexedDBHelper.getDB(
        DB_NAME, OBJECT_STORE_NAME, {autoIncrement: true});
  }

  /**
   * @param {string} key The IndexedDB object store key.
   * @param {{url: string, requestData: Object}} param2
   *   - url: The request URL.
   *   - requestData: The serialized request data.
   * // @return {Promise}
   */
  async _replayRequest(key, {url, requestData}) {
    const request = new Request(url, requestData);
    try {
      await fetch(request);

      // If the fetch succeeds, remove the item from IndexedDB.
      const db = await this._getDb();
      await db.delete(key);
    } catch (err) {
      // Do nothing
    }
  }

  /**
   * In sync-supporting browsers, this adds a listener for the sync event.
   * In non-sync-supporting browsers, this will retry the queue on service
   * worker startup.
   * @private
   */
  _addSyncListener() {
    self.addEventListener('sync', (event) => {
      event.waitUntil(this.replayRequests());
    });
  }

  /**
   * Registers a sync event with a tag unique to this instance.
   * @private
   */
  async _registerSync() {
    try {
      await this._waitUntilActive();
      await registration.sync.register(`${TAG_PREFIX}:${this._name}`);
    } catch (err) {
      // This means the registration failed for some reason, either because
      // the browser doesn't supported it or because the user has disabled it.
      // In either case, fallback to retrying on SW startup.
      // TODO(philipwalton): implement fallback.
    }
  }

  /**
   * @private 
   * @return {Promise}
   */
  _waitUntilActive() {
    if (self.registration.active) {
      return Promise.resolve();
    } else {
      return new Promise((resolve) => {
        self.addEventListener('activate', (event) => resolve());
      });
    }
  }
}
