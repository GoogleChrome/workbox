import BaseCacheManager from './base-manager.js';

class UnrevisionedManger extends BaseCacheManager {

  _onDuplicateEntryFound(newEntry, previous) {
    // NOOP. Just ignore duplication entries.
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
    return false;
  }
}

export default UnrevisionedManger;
