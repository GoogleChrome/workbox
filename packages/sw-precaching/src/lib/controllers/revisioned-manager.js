import ErrorFactory from '../error-factory';
import BaseCacheManager from './base-manager.js';
import RevisionDetailsModel from '../models/revision-details-model.js';
import {defaultCacheName} from '../constants';

class RevisionedManger extends BaseCacheManager {
  constructor() {
    super();

    this._revisionDetailsModel = new RevisionDetailsModel();
  }

  _onDuplicateEntryFound(newEntry, previousEntry) {
    // If entry exists, check the revision. If the revisions are the same
    // it's simply a duplicate entry. If they are different, we have two
    // identical requests with two different revisions which will put this
    // module into a bad state.
    if (previousEntry.revision !== newEntry.revision) {
      throw ErrorFactory.createError(
        'duplicate-entry-diff-revisions',
        new Error(`${JSON.stringify(previousEntry)} <=> ` +
          `${JSON.stringify(newEntry)}`),
      );
    }
  }

  /**
   * A simple helper method to get the cache used for precaching assets.
   * @return {Cache} The cache to be used for precaching.
   */
  _getCache() {
    return caches.open(defaultCacheName);
  }

  /**
   * This method confirms with a fileEntry is already in the cache with the
   * appropriate revision.
   * If the revision is known, matching the requested `fileEntry.revision` and
   * the cache entry exists for the `fileEntry.path` this method returns true.
   * False otherwise.
   * @param {Object} fileEntry A file entry with `path` and `revision`
   * parameters.
   * @param {Cache} openCache The cache to look for the asset in.
   * @return {Promise<Boolean>} Returns true is the fileEntry is already
   * cached, false otherwise.
   */
  async _isAlreadyCached(fileEntry, openCache) {
    const revisionDetails = await
      this._revisionDetailsModel.get(fileEntry.entryID);
    if (revisionDetails !== fileEntry.revision) {
      return false;
    }

    const cachedResponse = await openCache.match(fileEntry.request);
    return cachedResponse ? true : false;
  }

  async _onEntryCached(precacheEntry) {
    await this._revisionDetailsModel.put(
      precacheEntry.entryID, precacheEntry.revision);
  }

  /**
   * This method closes the indexdDB helper.
   */
  _close() {
    this._revisionDetailsModel._close();
  }
}

export default RevisionedManger;
