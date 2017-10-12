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

import {_private} from 'workbox-core';

const URL_KEY = 'url';
const TIMESTAMP_KEY = 'timestamp';

/**
 * Returns the timestamp model.
 */
class CacheTimestampsModel {
  /**
   *
   * @param {string} cacheName
   */
  constructor(cacheName) {
    // TODO Check cacheName

    this._cacheName = cacheName;
    this._storeName = cacheName;
  }

  /**
   *
   * @param {string} url
   * @param {number} timestamp
   * @return {Promise}
   */
  async setTimestamp(url, timestamp) {
    const db = await this._getDb();
    return db.put(this._storeName, {
      [URL_KEY]: url,
      [TIMESTAMP_KEY]: timestamp,
    });
  }

  /**
   * @return {Promise<DBWrapper>}
   */
  async _getDb() {
    if (this._db) {
      return this._db;
    }

    this._db = await _private.indexedDBHelper.getDB(
      `workbox-cache-expiration`,
      1,
      (db) => {
        const objectStore = db.createObjectStore(
          this._storeName, {keyPath: URL_KEY});
        objectStore.createIndex(TIMESTAMP_KEY, TIMESTAMP_KEY, {unique: false});
      },
    );

    return this._db;
  }
}

export default CacheTimestampsModel;
