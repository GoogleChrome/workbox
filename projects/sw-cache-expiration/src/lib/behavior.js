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

import idb from 'idb';
import Configuration from './configuration';
import assert from '../../../../lib/assert';
import {idbName, idbVersion} from './constants';

/**
 * TODO Behavior Description
 * @memberof module:sw-cache-expiration
 */
class Behavior {
  /**
   * @param {Object} input
   * @param {Object} input.configuration
   */
  constructor({configuration}) {
    if (typeof configuration === 'undefined') {
      configuration = {};
    }

    assert.isInstance({configuration}, Configuration);
    this.configuration = configuration;
  }

  /**
   * Get the cache name
   * @memberof module:sw-cache-expiration.Behavior
   * @member {String} cacheName
   */
  get cacheName() {
    return this.configuration.cacheName;
  }

  /**
   * Get the max cache entries.
   * @return {Number} Returns the number of max entries
   */
  get maxEntries() {
    return this.configuration.maxEntries;
  }

  /**
   * Get the max age for the cache entries.
   * @return {Number} Max age in seconds for cache entries.
   */
  get maxAgeSeconds() {
    return this.configuration.maxAgeSeconds;
  }

  /**
   * @private
   * @return {idb} Get open idb.
   */
  get db() {
    if (!this._db) {
      return idb.open(idbName, idbVersion, (upgradeDB) => {
        upgradeDB.createObjectStore(this.cacheName);
      }).then((db) => {
        this._db = db;
      });
    }

    return Promise.resolve(this._db);
  }

  /**
   * TODO updateTimestamp description
   * @private
   * @param {string} url
   * @param {Number} now Defaults to current date.
   * @return {Promise} Resolves once updated.
   */
  updateTimestamp(url, now) {
    if (typeof now === 'undefined') {
      now = Date.now();
    }

    return this.db.then((db) => {
      const tx = db.transaction(this.cacheName, 'readwrite');
      tx.objectStore(this.cacheName).put(now, url);
      return tx.complete;
    });
  }

  /**
   * TODO expireEntries description
   * @param {Number} now Defaults to the current time
   * @return {Promise} List of removed entries.
   */
  expireEntries(now) {
    if (typeof now === 'undefined') {
      now = Date.now();
    }

    const promises = [];
    promises.push(
      this.maxAgeSeconds ? this._expireOldEntries(now) : Promise.resolve([]));
    promises.push(
      this.maxEntries ? this._expireExtraEntries() : Promise.resolve([]));

    return Promise.all(promises)
      .then(([oldEntries, extraEntries]) => oldEntries.concat(extraEntries));
  }

  /**
   * @private
   * @param {Number} now
   * @return {Promise<Array<String>>} Promise that resolves to an
   *         array of urls.
   */
  _expireOldEntries(now) {
    if (typeof now === 'undefined') {
      now = Date.now();
    }

    const expireOlderThan = now - (this.maxAgeSeconds * 1000);
    const urls = [];
    return this.db.then((db) => {
      const tx = db.transaction(this.cacheName, 'readwrite');
      const store = tx.objectStore(this.cacheName);
      store.iterateCursor((cursor) => {
        if (!cursor) {
          return;
        }
        if (cursor.value < expireOlderThan) {
          urls.push(cursor.key);
          store.delete(cursor.key);
        }
        cursor.continue();
      });
      return tx.complete.then(() => urls);
    });
  }

  /**
   * @private
   * @return {Promise} Resolve to empty array.
   */
  _expireExtraEntries() {
    return Promise.resolve([]);
  }
}

export default Behavior;
