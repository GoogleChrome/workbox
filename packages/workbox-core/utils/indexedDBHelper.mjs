/**
 * This is a wrapper that makes it easier to use IDB.
 */
class DBWrapper {
  /**
   * Wraps a provided Database.
   * @param {IDBDatabase} idb
   * @param {string} storename
   */
  constructor(idb, storename) {
    this._db = idb;
    this._storename = storename;
  }

  /**
   * Get a value for a given ID.
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
   * Put a value in the database for a given id.
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
