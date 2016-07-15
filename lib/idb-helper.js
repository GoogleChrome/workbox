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

const idb = require('idb');

/**
 * A wrapper to store for an IDB connection to a particular ObjectStore.
 *
 * @private
 * @class
 */
function IDBHelper(name, version, storeName) {
  if (name == undefined || version == undefined || storeName == undefined) {
    throw Error('name, version, storeName must be passed to the constructor.');
  }

  this._name = name;
  this._version = version;
  this._storeName = storeName;
}

/**
 * Returns a promise that resolves with an open connection to IndexedDB, either
 * existing or newly opened.
 *
 * @private
 * @returns {Promise.<DB>}
 */
IDBHelper.prototype._getDb = function() {
  if (this._db) {
    return Promise.resolve(this._db);
  }

  return idb.open(this._name, this._version, upgradeDB => {
    upgradeDB.createObjectStore(this._storeName);
  }).then(db => {
    this._db = db;
    return db;
  });
};

/**
 * Wrapper on top of the idb wrapper, which simplifies saving the key/value
 * pair to the object store.
 * Returns a Promise that fulfills when the transaction completes.
 *
 * @private
 * @param {String} key
 * @param {Object} value
 * @returns {Promise.<T>}
 */
IDBHelper.prototype.put = function(key, value) {
  return this._getDb().then(db => {
    const tx = db.transaction(this._storeName, 'readwrite');
    const objectStore = tx.objectStore(this._storeName);
    objectStore.put(value, key);
    return tx.complete;
  });
};

/**
 * Wrapper on top of the idb wrapper, which simplifies deleting an entry
 * from the object store.
 * Returns a Promise that fulfills when the transaction completes.
 *
 * @private
 * @param {String} key
 * @returns {Promise.<T>}
 */
IDBHelper.prototype.delete = function(key) {
  return this._getDb().then(db => {
    const tx = db.transaction(this._storeName, 'readwrite');
    const objectStore = tx.objectStore(this._storeName);
    objectStore.delete(key);
    return tx.complete;
  });
};

/**
 * Wrapper on top of the idb wrapper, which simplifies getting a key's value
 * from the object store.
 * Returns a promise that fulfills with the value.
 *
 * @private
 * @param {String} key
 * @returns {Promise.<Object>}
 */
IDBHelper.prototype.get = function(key) {
  return this._getDb().then(db => {
    const tx = db.transaction(this._storeName);
    const objectStore = tx.objectStore(this._storeName);
    return objectStore.get(key);
  });
};

/**
 * Wrapper on top of the idb wrapper, which simplifies getting all the values
 * in an object store.
 * Returns a promise that fulfills with all the values.
 *
 * @private
 * @returns {Promise.<Array.<Object>>}
 */
IDBHelper.prototype.getAllValues = function() {
  return this._getDb().then(db => {
    const tx = db.transaction(this._storeName);
    const objectStore = tx.objectStore(this._storeName);
    return objectStore.getAll();
  });
};

/**
 * Wrapper on top of the idb wrapper, which simplifies getting all the keys
 * in an object store.
 * Returns a promise that fulfills with all the keys.
 *
 * @private
 * @param {String} storeName
 * @returns {Promise.<Array.<Object>>}
 */
IDBHelper.prototype.getAllKeys = function() {
  return this._getDb().then(db => {
    const tx = db.transaction(this._storeName);
    const objectStore = tx.objectStore(this._storeName);
    return objectStore.getAllKeys();
  });
};

module.exports = IDBHelper;
