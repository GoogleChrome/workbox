import {_private} from 'workbox-core';

// Allows minifier to mangle this name
const REVISON_IDB_FIELD = 'revision';

/**
 * This model will track the relevant information of entries that
 * are cached and their matching revision details.
 *
 * @private
 * @memberof module:workbox-precaching
 */
class PrecachedDetailsModel {
  /**
   * Construct a new model for a specific cache.
   *
   * @private
   * @param {string} cacheName
   */
  constructor(cacheName) {
    this._cacheName = _private.cacheNames.getPrecacheName(cacheName);
  }

  /**
   * Check if an entry is already cached. Returns false if
   * the entry isn't cached or the revision has changed.
   *
   * @param {PrecacheEntry} precacheEntry
   * @return {boolean}
   */
  async _isEntryCached(precacheEntry) {
    const revisionDetails = await this._getRevision(precacheEntry._entryId);
    if (revisionDetails !== precacheEntry._revision) {
      return false;
    }

    const openCache = await caches.open(this._cacheName);
    const cachedResponse = await openCache.match(precacheEntry._cacheRequest);
    return !!cachedResponse;
  }

  /**
   * @return {Promise<Array>}
   */
  async _getAllEntries() {
    const db = await this._getDb();
    return await db.getAll();
  }

  /**
   * Get the current revision details.
   *
   * @param {Object} entryId
   * @return {Promise<string|null>}
   */
  async _getRevision(entryId) {
    const db = await this._getDb();
    const data = await db.get(entryId);
    return data ? data[REVISON_IDB_FIELD] : null;
  }

  /**
   * Add an entry to the details model.
   *
   * @param {PrecacheEntry} precacheEntry
   */
  async _addEntry(precacheEntry) {
    const db = await this._getDb();
    await db.put(precacheEntry._entryId, {
      [REVISON_IDB_FIELD]: precacheEntry._revision,
    });
  }

  /**
   * Delete entry from details model.
   *
   * @param {string} entryId
   */
  async _deleteEntry(entryId) {
    const db = await this._getDb();
    await db.delete(entryId);
  }

  /**
   * Get db for this model.
   *
   * @return{Promise<DBWrapper>}
   */
  _getDb() {
    return _private.indexedDBHelper.getDB(
      `workbox-precaching`, `precached-details-models`);
  }
}

export default PrecachedDetailsModel;
