/*
  Copyright 2017 Google Inc.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import '../_version.mjs';

/**
 * This is a wrapper that makes it easier to use IDB.
 *
 * @private
 * @memberof module:workbox-core
 */
class DBWrapper {
  /**
   * Wraps a provided Database.
   *
   * @param {IDBDatabase} idb
   */
  constructor(idb) {
    this._db = idb;
  }

  /**
   * Get a value for a given ID.
   *
   * @param {string} storename
   * @param {Object} key
   * @return {Promise<string>}
   */
  get(storename, key) {
    return new Promise((resolve, reject) => {
      const transaction = this._db.transaction(storename, 'readonly');

      transaction.onerror = () => {
        // Don't forget to handle errors!
        reject(transaction.error);
      };

      const getRequest = transaction.objectStore(storename).get(key);
      getRequest.onsuccess = () => resolve(getRequest.result);
    });
  }

  /**
   * @param {string} storename
   * @param {string} [indexName]
   * @return {Promise}
   */
  getAll(storename, indexName) {
    return new Promise((resolve, reject) => {
      const items = {};

      const transaction = this._db.transaction(storename, 'readonly');
      transaction.onerror = () => {
        // Don't forget to handle errors!
        reject(transaction.error);
      };
      transaction.oncomplete = () => {
        resolve(items);
      };

      const objectStore = transaction.objectStore(storename);
      const storeToUse = indexName ? objectStore.index(indexName) : objectStore;
      const cursorRequest = storeToUse.openCursor();
      cursorRequest.onsuccess = (evt) => {
        const cursor = evt.target.result;
        if (!cursor) {
          return;
        }

        items[cursor.key] = cursor.value;
        cursor.continue();
      };
    });
  }

  /**
   * Put a value in the database for a given id.
   *
   * @param {string} storename
   * @param {Object} value
   * @param {Object} key
   * @return {Promise}
   */
  put(storename, value, key) {
    return new Promise((resolve, reject) => {
      const transaction = this._db.transaction(storename, 'readwrite');

      transaction.onerror = () => {
        // Don't forget to handle errors!
        reject(transaction.error);
      };

      const request = transaction.objectStore(storename).put(value, key);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Delete a value in the database with a given id.
   *
   * @param {string} storename
   * @param {Object} key
   * @return {Promise}
   */
  delete(storename, key) {
    return new Promise((resolve, reject) => {
      const transaction = this._db.transaction(storename, 'readwrite');

      transaction.onerror = () => {
        // Don't forget to handle errors!
        reject(transaction.error);
      };

      const request = transaction.objectStore(storename).delete(key);
      request.onsuccess = () => resolve();
    });
  }
}

/**
 * This class will be used to create a generic IndexedDB class for Workbox
 * to use, removing the annoying parts of the API.
 *
 * @private
 * @memberof module:workbox-core
 */
class IndexedDBHelper {
  /**
   * You should never construct this directly.
   */
  constructor() {
    this._opendedDBs = {};
  }

  /**
   * Get an opened IndexedDB.
   *
   * @param {string} dbName
   * @param {number} version
   * @param {Object} upgradeCb
   * @return {Promise<IDBObjectStore>}
   */
  async getDB(dbName, version, upgradeCb) {
    const db = await new Promise((resolve, reject) => {
      const openRequest = indexedDB.open(dbName, 1);
      openRequest.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create an objectStore for this database
        upgradeCb(db);
      };
      openRequest.onerror = () => {
        // Do something with request.errorCode!
        reject(openRequest.error);
      };

      openRequest.onsuccess = (event) => {
        resolve(event.target.result);
      };
    });

    this._opendedDBs[dbName] = new DBWrapper(db);
    return this._opendedDBs[dbName];
  }
}

export default new IndexedDBHelper();
