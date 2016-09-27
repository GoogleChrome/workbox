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

import Configuration from './configuration';
import assert from '../../../../lib/assert';
import idb from 'idb';
import {idbName, idbVersion} from './constants';

export default class {
  constructor({configuration}={}) {
    assert.isInstance({configuration}, Configuration);
    this.configuration = configuration;
  }

  get cacheName() {
    return this.configuration.cacheName;
  }

  get maxEntries() {
    return this.configuration.maxEntries;
  }

  get maxAgeSeconds() {
    return this.configuration.maxAgeSeconds;
  }

  get db() {
    if (!this._db) {
      return idb.open(idbName, idbVersion, upgradeDB => {
        upgradeDB.createObjectStore(this.cacheName);
      }).then(db => this._db = db);
    }

    return Promise.resolve(this._db);
  }

  updateTimestamp(url, now=Date.now()) {
    return this.db.then(db => {
      const tx = db.transaction(this.cacheName, 'readwrite');
      tx.objectStore(this.cacheName).put(now, url);
      return tx.complete;
    });
  }

  expireEntries(now=Date.now()) {
    const promises = [];
    promises.push(this.maxAgeSeconds ? this._expireOldEntries(now) : Promise.resolve([]));
    promises.push(this.maxEntries ? this._expireExtraEntries() : Promise.resolve([]));

    return Promise.all(promises)
      .then(([oldEntries, extraEntries]) => oldEntries.concat(extraEntries));
  }

  _expireOldEntries(now=Date.now()) {
    const expireOlderThan = now - (this.maxAgeSeconds * 1000);
    const urls = [];
    return this.db.then(db => {
      const tx = db.transaction(this.cacheName, 'readwrite');
      const store = tx.objectStore(this.cacheName);
      store.iterateCursor(cursor => {
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

  _expireExtraEntries() {
    return Promise.resolve([]);
  }
};
