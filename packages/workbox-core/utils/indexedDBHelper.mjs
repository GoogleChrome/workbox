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
   * @param {string} storename
   */
  constructor(idb, storename) {
    this._db = idb;
    this._storename = storename;
  }

  /**
   * Get a value for a given ID.
   *
   * @param {Object} key
   * @return {Promise<string>}
   */
  get(key) {
    return new Promise((resolve, reject) => {
      const transaction = this._db.transaction(this._storename, 'readonly');

      transaction.onerror = () => {
        // Don't forget to handle errors!
        reject(transaction.error);
      };

      const getRequest = transaction.objectStore(this._storename).get(key);
      getRequest.onsuccess = () => resolve(getRequest.result);
    });
  }

  /**
   * @return {Promise}
   */
  getAll() {
    return new Promise((resolve, reject) => {
      const items = {};

      const transaction = this._db.transaction(this._storename, 'readonly');
      transaction.onerror = () => {
        // Don't forget to handle errors!
        reject(transaction.error);
      };
      transaction.oncomplete = () => {
        resolve(items);
      };

      const objectStore = transaction.objectStore(this._storename);
      const cursorRequest = objectStore.openCursor();
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
   * @param {Object} key
   * @param {Object} value
   * @return {Promise}
   */
  put(key, value) {
    return new Promise((resolve, reject) => {
      const transaction = this._db.transaction(this._storename, 'readwrite');

      transaction.onerror = () => {
        // Don't forget to handle errors!
        reject(transaction.error);
      };

      const request = transaction.objectStore(this._storename).put(value, key);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Delete a value in the database with a given id.
   *
   * @param {Object} key
   * @return {Promise}
   */
  delete(key) {
    return new Promise((resolve, reject) => {
      const transaction = this._db.transaction(this._storename, 'readwrite');

      transaction.onerror = () => {
        // Don't forget to handle errors!
        reject(transaction.error);
      };

      const request = transaction.objectStore(this._storename).delete(key);
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
   * @param {string} name
   * @param {string} storename
   * @param {Object} objectStoreOptions
   * @return {Promise<IDBObjectStore>}
   */
  async getDB(name, storename, objectStoreOptions) {
    const id = `${name}::${storename}`;
    if (this._opendedDBs[id]) {
      return this._opendedDBs[id];
    }

    const db = await new Promise((resolve, reject) => {
      const openRequest = indexedDB.open(name, 1);
      openRequest.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create an objectStore for this database
        db.createObjectStore(storename, objectStoreOptions);
      };
      openRequest.onerror = () => {
        // Do something with request.errorCode!
        reject(openRequest.error);
      };

      openRequest.onsuccess = (event) => {
        resolve(event.target.result);
      };
    });

    this._opendedDBs[id] = new DBWrapper(db, storename);
    return this._opendedDBs[id];
  }
}

export default new IndexedDBHelper();
