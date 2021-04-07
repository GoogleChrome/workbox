/*
  Copyright 2021 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {openDB, DBSchema, IDBPDatabase} from 'idb';
import {RequestData} from './StorableRequest.js';
import './_version.js';

interface QueueDBSchema extends DBSchema {
  requests: {
    key: number;
    value: UnidentifiedQueueStoreEntry;
    indexes: {queueName: string};
  };
}

const DB_VERSION = 3;
const DB_NAME = 'workbox-background-sync';
const OBJECT_STORE_NAME = 'requests';
const INDEXED_PROP = 'queueName';

export interface UnidentifiedQueueStoreEntry {
  requestData: RequestData;
  timestamp: number;
  id?: number;
  queueName?: string;
  metadata?: object;
}

export interface QueueStoreEntry extends UnidentifiedQueueStoreEntry {
  id: number;
}

/**
 * A class to interact directly with IndexedDB to store a retrieve queue requests.
 *
 * @private
 */

export class QueueDb {
  private _db: IDBPDatabase<QueueDBSchema> | null = null;

  /**
   * Opens a connection to IDBDatabase.
   *
   * @private
   */
  private async open() {
    if (!this._db) {
      this._db = await openDB(DB_NAME, DB_VERSION, {
        upgrade: this._upgradeDb,
      });
    }
  }

  /**
   *
   * @param {UnidentifiedQueueStoreEntry} entry
   */
  async addEntry(entry: UnidentifiedQueueStoreEntry) {
    await this.open();
    await this._db!.add(OBJECT_STORE_NAME, entry);
  }

  /**
   * Returns the first entry in the ObjectStore
   *
   * @return {QueueStoreEntry}
   */
  async getFirstEntry(): Promise<QueueStoreEntry | any> {
    await this.open();
    const cursor = await this._db
      ?.transaction(OBJECT_STORE_NAME)
      .store.openCursor();

    if (cursor) {
      return cursor.value as QueueStoreEntry;
    }
  }

  /**
   *
   * @param query
   * @return {Promise<QueueStoreEntry[]>}
   */
  async getAllEntriesFromIndex(
    query?: IDBKeyRange,
  ): Promise<QueueStoreEntry[]> {
    await this.open();
    const results =
      await this._db?.getAllFromIndex(OBJECT_STORE_NAME, INDEXED_PROP, query) as QueueStoreEntry[];
    return results ? results : new Array<QueueStoreEntry>();
  }

  /**
   *
   * @param {number} id the id of the entry to be deleted
   */
  async deleteEntry(id: number) {
    await this.open();
    await this._db?.delete(OBJECT_STORE_NAME, id);
  }

  /**
   * Returns either the first or the last entries, depending on direction. Uses the index.
   *
   * @param {IDBCursorDirection} direction
   * @param {IDBKeyRange} query
   * @return {Promise<QueueStoreEntry | any>}
   */
  async getEndEntryFromIndex(
    {direction}: {direction?: IDBCursorDirection},
    query?: IDBKeyRange,
  ): Promise<QueueStoreEntry | any> {
    await this.open();

    const cursor = await this._db?.transaction(OBJECT_STORE_NAME)
      .store.index(INDEXED_PROP)
      .openCursor(query, direction);

    if (cursor) {
      return cursor.value as QueueStoreEntry;
    }
  }

  /**
   * Upgrades QueueDB
   *
   * @param {IDBPDatabase<QueueDBSchema>} db
   * @param {number} oldVersion
   * @private
   */
  private _upgradeDb(db: IDBPDatabase<QueueDBSchema>, oldVersion: number) {
    if (oldVersion > 0 && oldVersion < DB_VERSION) {
      if (db.objectStoreNames.contains(OBJECT_STORE_NAME)) {
        db.deleteObjectStore(OBJECT_STORE_NAME);
      }
    }

    const objStore = db.createObjectStore(OBJECT_STORE_NAME, {
      autoIncrement: true,
      keyPath: 'id',
    });
    objStore.createIndex(INDEXED_PROP, INDEXED_PROP, {unique: false});
  }
}
