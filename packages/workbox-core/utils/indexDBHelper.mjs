/**
 * This is a wrapper that makes it easier to use IDB.
 */
class DBWrapper {
  /**
   * Wraps a provided Database.
   * @param {IndexedDB} idb 
   */
  constructor(idb, storename) {
    this._db = idb;
    this._storename = storename;
  }

  /**
   * Get a value for a given ID.
   * @param {Object} key
   * @return {Promise<String>}
   */
  get(key) {
    return new Promise((resolve, reject) => {
      const transaction = this._db.transaction(this._storename, 'readwrite');

      transaction.onerror = function(event) {
        // Don't forget to handle errors!
        reject(transaction.error);
      };

      const getRequest = transaction.objectStore(this._storename).get(key);
      getRequest.onsuccess = (event) => {
        resolve(getRequest.result);
      };
    });
  }

  /**
   * Put a value in the database for a given id.
   * @param {Object} key 
   * @param {Object} value 
   * @return {Promise}
   */
  put(key, value) {
    return new Promise((resolve, reject) => {
      const transaction = this._db.transaction(this._storename, 'readwrite');

      transaction.onerror = function(event) {
        // Don't forget to handle errors!
        reject(transaction.error);
      };

      const request = transaction.objectStore(this._storename).put(value, key);
      request.onsuccess = (event) => {
        resolve();
      };
    });
  }

  /**
   * Delete a value in the database with a given id.
   * @param {Object} key
   * @return {Promise} 
   */
  delete(key) {
    return new Promise((resolve, reject) => {
      const transaction = this._db.transaction(this._storename, 'readwrite');

      transaction.onerror = function(event) {
        // Don't forget to handle errors!
        reject(transaction.error);
      };

      const request = transaction.objectStore(this._storename).delete(key);
      request.onsuccess = (event) => {
        resolve();
      };
    });
  }
}

/**
 * This class will be used to create a generic IndexedDB class for Workbox
 * to use, removing the annoying parts of the API.
 */
class IndexDBHelper {
  /**
   * You should never construct this directly.
   */
  constructor() {
    this._opendedDBs = {};
  }

  /**
   * Get an opened IndexedDB.
   * @param {String} name 
   * @param {Number} version 
   * @param {String} storename 
   * @param {Object} objectStoreOptions
   * @return {Promise<IndexedDBObjectStore>}
   */
  getDB(name, version, storename, objectStoreOptions) {
    if (this._opendedDBs[name]) {
      return Promise.resolve(this._opendedDBs[name]);
    }

    return new Promise((resolve, reject) => {
      const openRequest = indexedDB.open(name, version);
      openRequest.onupgradeneeded = function(event) {
        const db = event.target.result;

        // Create an objectStore for this database
        db.createObjectStore(storename, objectStoreOptions);
      };
      openRequest.onerror = function(event) {
        // Do something with request.errorCode!
        reject();
      };
      openRequest.onsuccess = function(event) {
        resolve(event.target.result);
      };
    })
    .then((db) => {
      this._opendedDBs[name] = new DBWrapper(db, storename);
      return this._opendedDBs[name];
    });
  }
}

export default new IndexDBHelper();
