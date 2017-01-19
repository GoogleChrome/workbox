import ErrorFactory from '../error-factory';

/**
 * This class handles the shared logic for caching revisioned and unrevisioned
 * assets.
 * @private
 * @memberof module:sw-precaching
 */
class BaseCacheManager {
  /**
   * Constructor for BaseCacheManager
   * @param {String} cacheName This is the cache name to store requested assets.
   */
  constructor(cacheName) {
    this._entriesToCache = new Map();
    this._cacheName = cacheName;
  }

  /**
   * This method will add the entries to the install list.
   * This will manage duplicate entries and perform the caching during
   * the install step.
   * @param {Array<String|Request|Object>} rawEntries A raw entry that can be
   * parsed into a BaseCacheEntry by the inheriting CacheManager.
   */
  cache(rawEntries) {
    rawEntries.forEach((rawEntry) => {
      this._addEntryToInstallList(
        this._parseEntry(rawEntry)
      );
    });
  }

  /**
   *This method gives access to the cache used by thie caching manager.
   * @return {String} The cache name used for this manager.
   */
  getCacheName() {
    return this._cacheName;
  }

  /**
   * This method returns an array of URL's that will be cached by this
   * cache manager.
   * @return {Array<URL>} An array of URLs that will be cached.
   */
  getCachedUrls() {
    const urls = [];
    this._entriesToCache.forEach((entryValue, entryUrl) => {
      // Force a consistent string style for the entries.
      urls.push(new URL(entryUrl, location).href);
    });
    return urls;
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
   * @private
   * @param {RevisionedCacheEntry} precacheEntry The file entry to be cached
   * during the next install event.
   */
  _addEntryToInstallList(precacheEntry) {
    const entryID = precacheEntry.entryID;
    const previousEntry = this._entriesToCache.get(precacheEntry.entryID);
    if (!previousEntry) {
      // This entry isn't in the install list
      this._entriesToCache.set(entryID, precacheEntry);
      return;
    }

    this._onDuplicateInstallEntryFound(precacheEntry, previousEntry);
  }

  /**
   * This method manages the actual install event to cache the revisioned
   * assets.
   *
   * @private
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
    return Promise.all(cachePromises);
  }

  /**
   * This method will request the entry and save it to the cache if the response
   * is valid.
   *
   * @private
   * @param {BaseCacheEntry} precacheEntry The entry to fetch and cache.
   * @return {Promise} Returns a promise that resolves once the entry is fetched
   * and cached.
   */
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

      return this._onEntryCached(precacheEntry);
    } else {
      throw ErrorFactory.createError('request-not-cached', {
        message: `Failed to get a cacheable response for ` +
          `'${precacheEntry.request.url}'`,
      });
    }
  }

  /**
   * This method will compare the URL's
   * and figure out which assets are no longer required to be cached.
   *
   * This should be called in the activate event.
   *
   * @private
   * @return {Promise} Promise that resolves once the cache entries have been
   * cleaned.
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

    return Promise.all(
      cachedRequestsToDelete.map((cachedRequest) => {
        return openCache.delete(cachedRequest);
      })
    );
  }

  /**
   * A simple helper method to get the cache used for precaching assets.
   *
   * @private
   * @return {Promise<Cache>} The cache to be used for precaching.
   */
  async _getCache() {
    if (!this._cache) {
      this._cache = await caches.open(this._cacheName);
    }

    return this._cache;
  }

  /**
   * This method ensures that the file entry in the maniest is valid and
   * can be parsed as a BaseCacheEntry.
   *
   * @private
   * @abstract
   * @param {String | Request | Object} input Either a URL string, a Request
   * or an object with a `url`, `revision` and optional `cacheBust` parameter.
   * @return {BaseCacheEntry} Returns a parsed version of the file entry.
   */
  _parseEntry(input) {
    throw ErrorFactory.createError('should-override');
  }

  /**
   * This method is called if the consumer of this cache manager has to
   * cache entries that are to be installed but have the same "entryID".
   * This means that the user is trying to cache the same thing twice.
   * This callback gives extending classed a chance to throw an error
   * if there is an edge case that can't be handled.
   *
   * @private
   * @abstract
   * @param {BaseCacheEntry} newEntry The entry that is to be cached.
   * @param {BaseCacheEntry} previous The entry that is currently cached.
   */
  _onDuplicateEntryFound(newEntry, previous) {
    throw ErrorFactory.createError('should-override');
  }

  /**
   * This method confirms with a fileEntry is already in the cache with the
   * appropriate revision.
   * If the revision is known, matching the requested `fileEntry.revision` and
   * the cache entry exists for the `fileEntry.path` this method returns true.
   * False otherwise.
   *
   * @private
   * @abstract
   * @param {BaseCacheEntry} precacheEntry A file entry with `path` and
   * `revision` parameters.
   * @return {Promise<Boolean>} Returns true is the fileEntry is already
   * cached, false otherwise.
   */
  _isAlreadyCached(precacheEntry) {
    throw ErrorFactory.createError('should-override');
  }

  /**
   * This method can be used for any work that needs to be done when a
   * URL has been cached.
   *
   * @private
   * @abstract
   * @param {BaseCacheEntry} precacheEntry A file entry with `path` and
   * `revision` parameters.
   * @return {Promise} Returns a Promise that resolves once it's work has
   * been done.
   */
  _onEntryCached(precacheEntry) {
    throw ErrorFactory.createError('should-override');
  }
}

export default BaseCacheManager;
