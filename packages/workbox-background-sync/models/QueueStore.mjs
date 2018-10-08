/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {DBWrapper} from 'workbox-core/_private/DBWrapper.mjs';
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
   *
   * @private
   */
  constructor(queue) {
    this._queue = queue;
    this._db = new DBWrapper(DB_NAME, 1, {
      onupgradeneeded: (evt) => evt.target.result
          .createObjectStore(OBJECT_STORE_NAME, {autoIncrement: true})
          .createIndex(INDEXED_PROP, INDEXED_PROP, {unique: false}),
    });
  }

  /**
   * Takes a StorableRequest instance, converts it to an object and adds it
   * as an entry in the object store.
   *
   * @param {StorableRequest} storableRequest
   *
   * @private
   */
  async addEntry(storableRequest) {
    await this._db.add(OBJECT_STORE_NAME, {
      queueName: this._queue.name,
      storableRequest: storableRequest.toObject(),
    });
  }

  /**
   * Gets the oldest entry in the object store, removes it, and returns the
   * value as a StorableRequest instance. If no entry exists, it returns
   * undefined.
   *
   * @return {StorableRequest|undefined}
   *
   * @private
   */
  async getAndRemoveOldestEntry() {
    const [entry] = await this._db.getAllMatching(OBJECT_STORE_NAME, {
      index: INDEXED_PROP,
      query: IDBKeyRange.only(this._queue.name),
      count: 1,
      includeKeys: true,
    });

    if (entry) {
      await this._db.delete(OBJECT_STORE_NAME, entry.primaryKey);
      return new StorableRequest(entry.value.storableRequest);
    }
  }
}
