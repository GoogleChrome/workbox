import ErrorFactory from '../error-factory';

class BaseCacheManager {
  constructor(cacheName) {
    this._entriesToCache = new Map();
    this._cacheName = cacheName;
  }

  cache(rawEntries) {
    rawEntries.forEach((rawEntry) => {
      this._addEntryToInstallList(
        this._parseEntry(rawEntry)
      );
    });
  }

  /**
   * This method will add an entry to the install list.
   *
   * This method will filter out duplicates and also checks for the scenario
   * where two entries have the same URL but different revisions. For example
   * caching:
   * [
   *   {url: '/hello.txt', revision: '1'},
   *   {url: '/hello.txt', revision: '2'},
   * ]
   * Will throw an error as the library can't determine the correct revision
   * and this may cause issues in future when updating the service worker
   * with new revisions.
   *
   * @param {RevisionedCacheEntry} fileEntry The file entry to be cached during
   * the next install event.
   */
  _addEntryToInstallList(precacheEntry) {
    const entryID = precacheEntry.entryID;
    const previousEntry = this._entriesToCache.get(precacheEntry.entryID);
    if (!previousEntry) {
      // This entry isn't in the install list
      this._entriesToCache.set(entryID, precacheEntry);
      return;
    }

    this._onDuplicateEntryFound(precacheEntry, previousEntry);
  }

  /**
   * This method manages the actual install event to cache the revisioned
   * assets.
   * @return {Promise} The promise resolves when all the desired assets are
   * cached.
   */
  async _performInstallStep() {
    if (this._entriesToCache.size === 0) {
      return;
    }

    const cachePromises = [];
    this._entriesToCache.forEach((precacheEntry) => {
      cachePromises.push(
        this._cacheEntry(precacheEntry)
      );
    });

    // Wait for all requests to be cached.
    await Promise.all(cachePromises);
  }

  async _cacheEntry(precacheEntry) {
    const isCached = await this._isAlreadyCached(precacheEntry);
    if (isCached) {
      return;
    }

    let response = await fetch(precacheEntry.getNetworkRequest(), {
        credentials: 'same-origin',
        redirect: 'follow',
      });

    if (response.ok) {
      const openCache = await this._getCache();
      await openCache.put(precacheEntry.request, response);

      await this._onEntryCached(precacheEntry);
    } else {
      throw ErrorFactory.createError('request-not-cached', {
        message: `Failed to get a cacheable response for ` +
          `'${precacheEntry.request.url}'`,
      });
    }
  }

  /**
   * Once the install event has occured and the previous entries need
   * to be deleted from the cache, this method will compare the URL's
   * and figure out which assets are no longer required to be precached.
   */
  async _cleanUpOldEntries() {
    if (!await caches.has(this._cacheName)) {
      // Cache doesn't exist, so nothing to delete
      return;
    }

    const requestsCachedOnInstall = [];
    this._entriesToCache.forEach((entry) => {
      requestsCachedOnInstall.push(entry.request.url);
    });

    const openCache = await this._getCache();
    const allCachedRequests = await openCache.keys();

    const cachedRequestsToDelete = allCachedRequests.filter((cachedRequest) => {
      if (requestsCachedOnInstall.includes(cachedRequest.url)) {
        return false;
      }
      return true;
    });

    await Promise.all(
      cachedRequestsToDelete.map((cachedRequest) => {
        return openCache.delete(cachedRequest);
      })
    );
  }

  /**
   * A simple helper method to get the cache used for precaching assets.
   * @return {Cache} The cache to be used for precaching.
   */
  async _getCache() {
    if (!this._cache) {
      this._cache = await caches.open(this._cacheName);
    }

    return this._cache;
  }

  _parseEntry(input) {
    throw ErrorFactory.createError('should-override');
  }

  _onDuplicateEntryFound(newEntry, previous) {
    throw ErrorFactory.createError('should-override');
  }

  _isAlreadyCached(precacheEntry) {
    throw ErrorFactory.createError('should-override');
  }

  _onEntryCached(precacheEntry) {
    throw ErrorFactory.createError('should-override');
  }
}

export default BaseCacheManager;
