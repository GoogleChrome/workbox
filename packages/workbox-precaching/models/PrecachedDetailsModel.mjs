import {_private} from 'workbox-core';

/**
 * This model will track the relevant information of entries that
 * are cached and their matching revision details.
 */
export default class PrecachedDetailsModel {
  /**
   * Construct a new model for a specific cache.
   * @param {string} cacheName
   */
  constructor(cacheName) {
    this._cacheName = _private.cacheNameProvider.getPrecacheName(cacheName);
  }

  /**
   * Check if an entry is already cached. Returns false if
   * the entry isn't cached or the revision has changed.
   * @param {PrecacheEntry} precacheEntry
   * @return {boolean}
   */
  async isEntryCached(precacheEntry) {
    const revisionDetails = await this._getRevision(precacheEntry._entryId);
    if (revisionDetails !== precacheEntry._revision) {
      return false;
    }

    const openCache = await caches.open(this._cacheName);
    const cachedResponse = await openCache.match(precacheEntry._request);
    return !!cachedResponse;
  }

  /**
   * Get the current revision details.
   * @param {Object} entryId
   * @return {Promise<string|null>}
   */
  async _getRevision(entryId) {
    const db = await this._getDb();
    const data = await db.get(entryId);
    return data ? data.revision : null;
  }

  /**
   * Add an entry to the details model.
   * @param {PrecacheEntry} precacheEntry
   */
  async addEntry(precacheEntry) {
    const db = await this._getDb();
    await db.put(precacheEntry._entryId, {
      revision: precacheEntry._revision,
    });
  }

  /**
   * Delete entry from details model;
   * @param {PrecacheEntry} precacheEntry
   */
  async deleteEntry(precacheEntry) {
    const db = await this._getDb();
    await db.delete(precacheEntry._entryId);
  }

  /**
   * Get db for this model.
   * @return{Promise<DBWrapper>}
   */
  _getDb() {
    return _private.indexedDBHelper.getDB(
      `workbox-precaching`, `precached-details-models`);
  }
}
