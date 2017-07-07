import {RequestWrapper} from '../../../../workbox-runtime-caching/src/index';
import WorkboxError from '../../../../../lib/workbox-error';

/**
 * This class handles the shared logic for caching revisioned and unrevisioned
 * assets.
 *
 * @memberof module:workbox-precaching
 */
class BaseCacheManager {
  /**
   * Constructor for BaseCacheManager
   *
   * @param {Object} input
   * @param {String} [input.cacheName] This is the cache name to store requested
   * assets.
   * @param {String} [input.cacheId] The cacheId can be used to ensure that
   * multiple projects sharing `http://localhost` have unique cache names.
   * @param {Array<Object>} [input.plugins] Any plugins that should be
   * invoked by the underlying `RequestWrapper`.
   */
  constructor({cacheName, cacheId, plugins} = {}) {
    if (cacheId && (typeof cacheId !== 'string' || cacheId.length === 0)) {
      throw new WorkboxError('bad-cache-id', {cacheId});
    }

    this._entriesToCache = new Map();
    this._requestWrapper = new RequestWrapper({
      cacheName,
      cacheId,
      plugins,
      fetchOptions: {
        credentials: 'same-origin',
      },
    });
  }

  /**
   * Adds entries to the install list.
   * This will manage duplicate entries and perform the caching during
   * the install step.
   *
   * @private
   * @param {Array<String|Request|Object>} rawEntries A raw entry that can be
   * parsed into a BaseCacheEntry by the inheriting CacheManager.
   */
  _addEntries(rawEntries) {
    this._parsedCacheUrls = null;

    rawEntries.forEach((rawEntry) => {
      this._addEntryToInstallList(
        this._parseEntry(rawEntry)
      );
    });
  }

  /**
   * Gives access to the cache name used by this caching manager.
   * @return {String} The cache name used by this manager.
   */
  getCacheName() {
    return this._requestWrapper.cacheName;
  }

  /**
   * Returns an array of fully qualified URL's that will be cached by this
   * cache manager.
   *
   * @return {Array<String>} An array of URLs that will be cached.
   */
  getCachedUrls() {
    if (!this._parsedCacheUrls) {
      this._parsedCacheUrls = Array.from(this._entriesToCache.keys())
        .map((url) => new URL(url, location).href);
    }

    return this._parsedCacheUrls;
  }

  /**
   * Adds an entry to the install list.
   *
   * Duplicates are filtered out and checks are made for the scenario
   * where two entries have the same URL but different revisions. For example
   * caching:
   * [
   *   {url: '/hello.txt', revision: 'abcd1234'},
   *   {url: '/hello.txt', revision: 'efgh5678'},
   * ]
   * This will throw an error as the library can't determine the correct
   * revision and this may cause issues in future when updating the service
   * worker with new revisions.
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
   * This method will go through each asset added to the cache list and
   * fetch and update the cache for assets which have a new revision hash.
   *
   * @return {Promise} The promise resolves when all the desired assets are
   * cached and up -to-date.
   */
  async install() {
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
   * Requests the entry and saves it to the cache if the response
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

    try {
      await this._requestWrapper.fetchAndCache({
        request: precacheEntry.getNetworkRequest(),
        waitOnCache: true,
        cacheKey: precacheEntry.request,
        cleanRedirects: true,
      });

      return this._onEntryCached(precacheEntry);
    } catch (err) {
      throw new WorkboxError('request-not-cached', {
        url: precacheEntry.request.url,
        error: err,
      });
    }
  }

  /**
   * Compare the URL's and determines which assets are no longer required
   * in the cache.
   *
   * This should be called in the service worker activate event.
   *
   * @return {Promise} Promise that resolves once the cache entries have been
   * cleaned.
   */
  async cleanup() {
    if (!await caches.has(this.getCacheName())) {
      // Cache doesn't exist, so nothing to delete
      return;
    }

    const requestsCachedOnInstall = [];
    this._entriesToCache.forEach((entry) => {
      requestsCachedOnInstall.push(entry.request.url);
    });

    const openCache = await this._getCache();
    const allCachedRequests = await openCache.keys();

    const cachedRequestsToDelete = allCachedRequests.filter(
      (cachedRequest) => !requestsCachedOnInstall.includes(cachedRequest.url));

    return Promise.all(
      cachedRequestsToDelete.map(async (cachedRequest) => {
        await openCache.delete(cachedRequest);
        await this._onEntryDeleted(cachedRequest.url);
      })
    );
  }

  /**
   * A simple helper method to get the open cache used for precaching assets.
   *
   * @private
   * @return {Promise<Cache>} The cache to be used for precaching.
   */
  async _getCache() {
    if (!this._cache) {
      this._cache = await caches.open(this.getCacheName());
    }

    return this._cache;
  }

  /**
   * Ensures the file entry in the maniest is valid and
   * can be parsed as a BaseCacheEntry.
   *
   * @private
   * @abstract
   * @param {String | Request | Object} input Either a URL string, a Request
   * or an object with a `url`, `revision` and optional `cacheBust` parameter.
   * @return {BaseCacheEntry} Returns a parsed version of the file entry.
   */
  _parseEntry(input) {
    throw new WorkboxError('requires-overriding');
  }

  /**
   * Called in case subclasses have cache entries that are to be installed
   * but have the same "entryID".
   * This means that the user is trying to cache the same thing twice.
   * Subclasses can use this method to throw an error if there is an edge
   * case that can't be handled.
   *
   * @private
   * @abstract
   * @param {BaseCacheEntry} newEntry The entry that is to be cached.
   * @param {BaseCacheEntry} previous The entry that is currently cached.
   */
  _onDuplicateEntryFound(newEntry, previous) {
    throw new WorkboxError('requires-overriding');
  }

  /**
   * Confirms whether a fileEntry is already in the cache with the
   * appropriate revision or not.
   *
   * @private
   * @abstract
   * @param {BaseCacheEntry} precacheEntry A file entry with `path` and
   * `revision` parameters.
   * @return {Promise<Boolean>} Returns true is the fileEntry is already
   * cached, false otherwise.
   */
  _isAlreadyCached(precacheEntry) {
    throw new WorkboxError('requires-overriding');
  }

  /**
   * Subclasses can use this method for any work that needs to be done once a
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
    throw new WorkboxError('requires-overriding');
  }

  /**
   * Subclasses can use this method for any work that needs to be done once a
   * URL has been deleted from the cache.
   *
   * @private
   * @abstract
   * @param {String} url The URL of the entry that was deleted.
   * @return {Promise} Returns a Promise that resolves once the work is done.
   */
  _onEntryDeleted(url) {
    throw new WorkboxError('requires-overriding');
  }
}

export default BaseCacheManager;
