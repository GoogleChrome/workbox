/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {assert} from 'workbox-core/_private/assert.mjs';
import {DBWrapper} from 'workbox-core/_private/DBWrapper.mjs';
import {migrateDb} from 'workbox-core/_private/migrateDb.mjs';
import {DB_NAME, DB_VERSION, OBJECT_STORE_NAME, INDEXED_PROP} from '../lib/constants.mjs';

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
   * @param {string} queueName
   * @private
   */
  constructor(queueName) {
    this._queueName = queueName;
    this._db = new DBWrapper(DB_NAME, DB_VERSION, {
      onupgradeneeded: (evt) => this._upgradeDb(evt),
    });
  }

  /**
   * Append an entry last in the queue.
   *
   * @param {Object} entry
   * @param {Object} entry.requestData
   * @param {number} [entry.timestamp]
   * @param {Object} [entry.metadata]
   */
  async pushEntry(entry) {
    if (process.env.NODE_ENV !== 'production') {
      assert.isType(entry, 'object', {
        moduleName: 'workbox-background-sync',
        className: 'QueueStore',
        funcName: 'pushEntry',
        paramName: 'entry',
      });
      assert.isType(entry.requestData, 'object', {
        moduleName: 'workbox-background-sync',
        className: 'QueueStore',
        funcName: 'pushEntry',
        paramName: 'entry.requestData',
      });
    }

    // Don't specify an ID since one is automatically generated.
    delete entry.id;
    entry.queueName = this._queueName;

    await this._db.add(OBJECT_STORE_NAME, entry);
  }

  /**
   * Preppend an entry first in the queue.
   *
   * @param {Object} entry
   * @param {Object} entry.requestData
   * @param {number} [entry.timestamp]
   * @param {Object} [entry.metadata]
   */
  async unshiftEntry(entry) {
    if (process.env.NODE_ENV !== 'production') {
      assert.isType(entry, 'object', {
        moduleName: 'workbox-background-sync',
        className: 'QueueStore',
        funcName: 'unshiftEntry',
        paramName: 'entry',
      });
      assert.isType(entry.requestData, 'object', {
        moduleName: 'workbox-background-sync',
        className: 'QueueStore',
        funcName: 'unshiftEntry',
        paramName: 'entry.requestData',
      });
    }

    const [firstEntry] = await this._db.getAllMatching(OBJECT_STORE_NAME, {
      count: 1,
    });

    if (firstEntry) {
      // Pick an ID one less than the lowest ID in the object store.
      entry.id = firstEntry.id - 1;
    } else {
      delete entry.id;
    }
    entry.queueName = this._queueName;

    await this._db.add(OBJECT_STORE_NAME, entry);
  }

  /**
   * Removes and returns the last entry in the queue matching the `queueName`.
   *
   * @return {Promise<Object>}
   */
  async popEntry() {
    return this._removeEntry({direction: 'prev'});
  }

  /**
   * Removes and returns the first entry in the queue matching the `queueName`.
   *
   * @return {Promise<Object>}
   */
  async shiftEntry() {
    return this._removeEntry({direction: 'next'});
  }

  /**
   * Removes and returns the first or last entry in the queue (based on the
   * `direction` argument) matching the `queueName`.
   *
   * @return {Promise<Object>}
   */
  async _removeEntry({direction}) {
    const [entry] = await this._db.getAllMatching(OBJECT_STORE_NAME, {
      direction,
      index: INDEXED_PROP,
      query: IDBKeyRange.only(this._queueName),
      count: 1,
    });

    if (entry) {
      await this._db.delete(OBJECT_STORE_NAME, entry.id);

      // Dont' expose the ID or queueName;
      delete entry.id;
      delete entry.queueName;
      return entry;
    }
  }

  /**
   * Upgrades the database given an `upgradeneeded` event.
   *
   * @param {Event} event
   */
  _upgradeDb(event) {
    const db = event.target.result;
    const txn = event.target.transaction;
    let oldEntries = [];

    migrateDb(event, {
      v1: (next) => {
        // When migrating from version 0, this will not exist.
        if (db.objectStoreNames.contains(OBJECT_STORE_NAME)) {
          // Get any existing entries in the v1 requests store
          // and then delete it.
          const objStore = txn.objectStore(OBJECT_STORE_NAME);
          objStore.openCursor().onsuccess = ({target}) => {
            const cursor = target.result;
            if (cursor) {
              oldEntries.push(cursor.value);
              cursor.continue();
            } else {
              db.deleteObjectStore(OBJECT_STORE_NAME);
              next();
            }
          };
        } else {
          next();
        }
      },
      v2: (next) => {
        // Creates v2 of the requests store and adds back any existing
        // entries in the new format.
        const objStore = db.createObjectStore(OBJECT_STORE_NAME, {
          autoIncrement: true,
          keyPath: 'id',
        });
        objStore.createIndex(INDEXED_PROP, INDEXED_PROP, {unique: false});

        if (oldEntries.length) {
          for (const {queueName, storableRequest} of oldEntries) {
            // Move the timestamp from `storableRequest` to the top level.
            const timestamp = storableRequest.timestamp;

            // Reformat the storable request data
            const requestData = Object.assign(
                storableRequest.requestInit, {url: storableRequest.url});

            objStore.add({queueName, timestamp, requestData});
          }
        }
        next();
      },
    });
  }
}
