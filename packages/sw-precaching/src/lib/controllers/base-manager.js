import ErrorFactory from '../error-factory';
import StringPrecacheEntry from
  '../models/precache-entries/string-precache-entry.js';
import ObjectPrecacheEntry from
  '../models/precache-entries/object-precache-entry.js';

class BaseCacheManager {
  constructor() {
    this._entriesToCache = {};
  }

  cache(rawEntries) {
    rawEntries.forEach((rawEntry) => {
      const precacheEntry = this._parseEntry(rawEntry);
      this._addEntryToInstallList(precacheEntry);
    });
  }

  /**
   * This method ensures that the file entry in the maniest is valid and
   * if the entry is a revisioned string path, it is converted to an object
   * with the desired fields.
   * @param {String | object} input Either a URL string or an object
   * with a `url`, `revision` and optional `cacheBust` parameter.
   * @return {object} Returns a parsed version of the file entry with absolute
   * URL, revision and a cacheBust value.
   */
  _parseEntry(input) {
    if (typeof input === 'undefined' || input === null) {
      throw ErrorFactory.createError('invalid-file-manifest-entry',
        new Error('Invalid file entry: ' + JSON.stringify(input)));
    }

    let precacheEntry;
    switch(typeof input) {
      case 'string': {
        precacheEntry = new StringPrecacheEntry(input);
        break;
      }
      case 'object': {
        precacheEntry = new ObjectPrecacheEntry(input);
        break;
      }
      default: {
        throw ErrorFactory.createError('invalid-file-manifest-entry',
          new Error('Invalid file entry: ' +
            JSON.stringify(precacheEntry)));
      }
    }

    return precacheEntry;
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
  _addEntryToInstallList(precacheEntry, isRevisioned) {
    const entryID = precacheEntry.entryID;
    const previousEntry = this._entriesToCache[precacheEntry.entryID];

    if (!previousEntry) {
      // This entry isn't in the install list
      this._entriesToCache[entryID] = precacheEntry;
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
  async _performInstallStep(cacheName) {
    if (Object.keys(this._entriesToCache).length === 0) {
      return;
    }

    let openCache = await this._getCache();

    const entriesToCache = Object.values(this._entriesToCache);
    const cachePromises = entriesToCache.map(async (precacheEntry) => {
      return this._cacheEntry(precacheEntry, openCache);
    });

    // Wait for all requests to be cached.
    await Promise.all(cachePromises);
  }

  async _cacheEntry(precacheEntry, openCache) {
    const isCached = await this._isAlreadyCached(precacheEntry, openCache);
    if (isCached) {
      return;
    }

    let response = await fetch(precacheEntry.getNetworkRequest(), {
        credentials: 'same-origin',
      });

    if (response.ok) {
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
    const requestsCachedOnInstall = Object.values(this._entriesToCache)
      .map((entry) => entry.request.url);

    let openCache = await this._getCache();
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

  _onDuplicateEntryFound(newEntry, previous) {
    throw new Error('This should be overriden by extending class.');
  }

  _getCache() {
    throw new Error('This should be overriden by extending class.');
  }

  _isAlreadyCached(precacheEntry, openCache) {
    throw new Error('This should be overriden by extending class.');
  }

  _onEntryCached(precacheEntry) {
    // NOOP
  }
}

export default BaseCacheManager;
