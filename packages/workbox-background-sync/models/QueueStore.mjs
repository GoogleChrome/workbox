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

import StorableRequest from './StorableRequest.mjs';
import {DB_NAME, OBJECT_STORE_NAME, INDEXED_PROP} from '../utils/constants.mjs';
import '../_version.mjs';

/**
 * A class to manage storing requests from a Queue in IndexedbDB,
 * indexed by their queue name for easier access.
 *
 * @private
 */
export class QueueStore {
  /**
   * Associates this instance with a Queue instance, so entries added can be
   * identified by their queue name.
   *
   * @param {Queue} queue
   */
  constructor(queue) {
    this._queue = queue;
  }

  /**
   * Takes a StorableRequest instance, converts it to an object and adds it
   * as an entry in the object store.
   *
   * @param {StorableRequest} storableRequest
   */
  async addEntry(storableRequest) {
    const db = await this._getDb();

    await new Promise((resolve, reject) => {
      const txn = db.transaction(OBJECT_STORE_NAME, 'readwrite');
      txn.onerror = () => reject(txn.error);
      txn.oncomplete = () => resolve();

      txn.objectStore(OBJECT_STORE_NAME).add({
        queueName: this._queue.name,
        storableRequest: storableRequest.toObject(),
      });
    });
  }

  /**
   * Gets the oldest entry in the object store, removes it, and returns the
   * value as a StorableRequest instance. If no entry exists, it returns
   * undefined.
   *
   * @return {Promise<StorableRequest|undefined>}
   */
  async getAndRemoveOldestEntry() {
    const db = await this._getDb();
    const entry = await new Promise((resolve, reject) => {
      const txn = db.transaction(OBJECT_STORE_NAME, 'readwrite');
      const objStore = txn.objectStore(OBJECT_STORE_NAME);
      txn.onerror = () => reject(txn.error);

      const query = IDBKeyRange.only(this._queue.name);
      const idx = objStore.index(INDEXED_PROP);
      idx.openCursor(query).onsuccess = (evt) => {
        const cursor = evt.target.result;

        // If no matching entries exist, resolve with undefined.
        if (!cursor) return resolve();

        const {primaryKey, value} = cursor;
        objStore.delete(primaryKey).onsuccess = () => {
          resolve(new StorableRequest(value.storableRequest));
        };
      };
    });

    return entry;
  }

  /**
   * Creates a new IndexedDB database (if one does not already exist) or
   * returns the open references to the existing one.
   * A promise with the DB reference is returned so this method can be invoked
   * multiple times safely.
   *
   * @return {Promise}
   */
  _getDb() {
    if (this._dbPromise) return this._dbPromise;

    return this._dbPromise = new Promise((resolve, reject) => {
      const openRequest = indexedDB.open(DB_NAME, 1);
      openRequest.onupgradeneeded = (event) => {
        const db = event.target.result;
        const objStore = db.createObjectStore(
            OBJECT_STORE_NAME, {autoIncrement: true});

        objStore.createIndex(INDEXED_PROP, INDEXED_PROP, {unique: false});
      };
      openRequest.onerror = () => reject(openRequest.error);
      openRequest.onsuccess = (event) => resolve(event.target.result);
    });
  }
}
