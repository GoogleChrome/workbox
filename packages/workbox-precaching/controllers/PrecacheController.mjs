import {_private} from 'workbox-core';
import core from 'workbox-core';

import PrecacheEntry from '../models/PrecacheEntry.mjs';
import showWarningsIfNeeded from '../utils/showWarningsIfNeeded.mjs';

/**
 * Performs efficient precaching of assets.
 */
export default class PrecacheController {
  /**
   * Create a new PrecacheController Instance
   */
  constructor() {
    this._entriesToCacheMap = new Map();
    if (process.env.NODE_ENV !== 'production') {
      this.checkEntryRevisioning = true;
    }
  }

  /**
   * This method will add items to the precache list, removing duplicates
   * and ensuring the information is valid.
   * @param {Array<Object|String>} userEntries Array of entries to
   * precache.
   */
  addToCacheList(userEntries) {
    if (process.env.NODE_ENV !== 'production') {
      core.assert.isArray(userEntries, {
        moduleName: 'workbox-precaching',
        className: 'PrecacheController',
        funcName: 'addToCacheList',
        paramName: 'userEntries',
      });
    }

    userEntries.map((userEntry) => {
      this._addEntryToCacheList(
        this._parseEntry(userEntry)
      );
    });

    if (process.env.NODE_ENV !== 'production') {
      if (this.checkEntryRevisioning === true) {
        showWarningsIfNeeded(userEntries);
      }
    }
  }

  /**
   * This method returns a precache entry.
   * @param input
   */
  _parseEntry(input) {
    switch (typeof input) {
      case 'string':
        if (input.length === 0) {
          throw new _private.WorkboxError('add-to-cache-list-unexpected-type', {
            entry: input,
          });
        }

        return new PrecacheEntry(input, input, input);
      case 'object':
        if (!input || !input.url) {
          throw new _private.WorkboxError('add-to-cache-list-unexpected-type', {
            entry: input,
          });
        }

        return new PrecacheEntry(input, input.url, input.revision || input.url);
      default:
        throw new _private.WorkboxError('add-to-cache-list-unexpected-type', {
          entry: input,
        });
    }
  }

  /**
   * Adds an entry to the precache list, accounting for possible duplicates.
   * @param {PrecacheEntry} entryToAdd
   */
  _addEntryToCacheList(entryToAdd) {
    // Check if the entry is already part of the map
    const existingEntry = this._entriesToCacheMap.get(entryToAdd._entryId);
    if (!existingEntry) {
      this._entriesToCacheMap.set(entryToAdd._entryId, entryToAdd);
      return;
    }

    // Duplicates are fine, but make sure the revision information
    // is the same.
    if (existingEntry._revision !== entryToAdd._revision) {
      throw new _private.WorkboxError('add-to-cache-list-conflicting-entries', {
        firstEntry: existingEntry._originalInput,
        secondEntry: entryToAdd._originalInput,
      });
    }
  }

  async install() {
    if (this._entriesToCacheMap.size === 0) {
      return [];
    }

    const cachePromises = [];
    this._entriesToCacheMap.forEach((precacheEntry) => {
      cachePromises.push(this._cacheEntry(precacheEntry));
    });

    // Wait for all requests to be cached.
    await Promise.all(cachePromises);

    if (process.env.NODE_ENV !== 'production') {
      // TODO: Log details of number of updated / non-updated assets
      /** const updatedCacheDetails = [];
      const notUpdatedCacheDetails = [];
      allCacheDetails.forEach((cacheDetails) => {
        if (cacheDetails.wasUpdated) {
          updatedCacheDetails.push({
            url: cacheDetails.url,
            revision: cacheDetails.revision,
          });
        } else {
          notUpdatedCacheDetails.push({
            url: cacheDetails.url,
            revision: cacheDetails.revision,
          });
        }
      });

      const logData = {};
      if (updatedCacheDetails.length > 0) {
        logData['New / Updated Precache URL\'s'] =
          this._createLogFriendlyString(updatedCacheDetails);
      }

      if (notUpdatedCacheDetails.length > 0) {
        logData['Up-to-date Precache URL\'s'] =
          this._createLogFriendlyString(notUpdatedCacheDetails);
      }

      logHelper.log({
        message: `Precache Details: ${updatedCacheDetails.length} requests ` +
        `were added or updated and ` +
        `${notUpdatedCacheDetails.length} request are already ` +
        `cached and up-to-date.`,
        data: logData,
      });**/
    }
  }

  /**
   * Requests the entry and saves it to the cache if the response
   * is valid.
   *
   * @private
   * @param {BaseCacheEntry} precacheEntry The entry to fetch and cache.
   * @return {Promise<Object>} Returns a promise that resolves once the entry
   * has been fetched and cached or skipped if no update is needed. The
   * promise resolved with details of the entry and whether it was
   * updated or not.
   */
  async _cacheEntry(precacheEntry) {
    if (await this._isAlreadyCached(precacheEntry)) {
      return false;
    }

    try {
      await Promise.resolve();
      /** await this._requestWrapper.fetchAndCache({
        request: precacheEntry.getNetworkRequest(),
        waitOnCache: true,
        cacheKey: precacheEntry.request,
        cleanRedirects: true,
      });

      await this._onEntryCached(precacheEntry);**/
      return true;
    } catch (err) {
      throw new _private.WorkboxError('request-not-cached', {
        url: precacheEntry.request.url,
        error: err,
      });
    }
  }

  async _isAlreadyCached(precacheEntry) {
    return false;
  }
}
