import {_private} from 'workbox-core';

const VERSION = 1;

/**
 * This model will track the relevant information of entries that
 * are cached and their matching revision details.
 */
export default class PrecachedDetailsModel {
  /**
   * Construct a new model for a specific cache.
   * @param {String} cacheName 
   */
  constructor(cacheName) {
    this._cacheName = _private.cacheNameProvider.getPrecacheName(cacheName);
  }

  /**
   * Check if an entry is already cached. Returns false if
   * the entry isn't cached or the revisioned has changed.
   * @param {PrecacheEntry} precacheEntry 
   * @return {Boolean}
   */
  async isEntryCached(precacheEntry) {
    const revisionDetails = await this._getRevision(precacheEntry._entryId);
    if (revisionDetails !== precacheEntry._revision) {
      return false;
    }

    const openCache = await caches.open(this._cacheName);
    const cachedResponse = await openCache.match(precacheEntry._request);
    return cachedResponse ? true : false;
  }

  /**
   * Get the current revision details.
   * @param {Object} entryId
   * @return {Promise<String>}
   */
  async _getRevision(entryId) {
    return this._getDb()
    .then((db) => {
      return db.get(entryId);
    })
    .then((data) => {
      return data ? data.revision : null;
    });
  }

  /**
   * Add an entry to the details model.
   * @param {PrecacheEntry} precacheEntry 
   * @return {Promise}
   */
  addEntry(precacheEntry) {
    return this._getDb()
    .then((db) => {
      return db.put(precacheEntry._entryId, {
        revision: precacheEntry._revision,
      });
    });
  }

  deleteEntry(precacheEntry) {
    return this._getDb()
    .then((db) => {
      return db.delete(precacheEntry._entryId);
    });
  }

  /**
   * Get db for this model.
   * @return{Promise<DBWrapper>}
   */
  _getDb() {
    return _private.indexDBHelper.getDB(
      `workbox-precaching`, VERSION, `precached-details-models`);
  }
}
