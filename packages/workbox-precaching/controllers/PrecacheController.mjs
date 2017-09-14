import {_private} from 'workbox-core';
import core from 'workbox-core';

import PrecacheEntry from '../models/PrecacheEntry.mjs';
import showWarningsIfNeeded from '../utils/showWarningsIfNeeded.mjs';
import printInstallDetails from '../utils/printInstallDetails.mjs';
import cleanRedirect from '../utils/cleanRedirect.mjs';

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
      case 'string': {
        if (input.length === 0) {
          throw new _private.WorkboxError('add-to-cache-list-unexpected-type', {
            entry: input,
          });
        }

        return new PrecacheEntry(input, input, input, new Request(input));
      }
      case 'object': {
        if (!input || !input.url) {
          throw new _private.WorkboxError('add-to-cache-list-unexpected-type', {
            entry: input,
          });
        }

        const cacheBust = input.revision ? true : false;
        return new PrecacheEntry(input, input.url, input.revision || input.url,
          new Request(input.url), cacheBust);
      }
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

  /**
   * Call this method from a service work install event to start
   * precaching assets.
   *
   */
  async install() {
    const updatedEntries = [];
    const notUpdatedEntries = [];

    const cachePromises = [];
    this._entriesToCacheMap.forEach((precacheEntry) => {
      const promiseChain = this._cacheEntry(precacheEntry)
      .then((wasUpdated) => {
        if (wasUpdated) {
          updatedEntries.push(precacheEntry);
        } else {
          notUpdatedEntries.push(precacheEntry);
        }
      });

      cachePromises.push(promiseChain);
    });

    // Wait for all requests to be cached.
    await Promise.all(cachePromises);

    if (process.env.NODE_ENV !== 'production') {
      printInstallDetails(updatedEntries, notUpdatedEntries);
    }

    return {
      'updatedEntries': updatedEntries,
      'notUpdatedEntries': notUpdatedEntries,
    };
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
    // TODO: Check if it's already cached.

    let response = await _private.fetchWrapper.fetch(
      precacheEntry._networkRequest,
    );

    if (response.redirected) {
      response = await cleanRedirect(response);
    }

    await _private.cacheWrapper.put('TODO-CHANGE-ME',
      precacheEntry._cacheRequest, response);

    // TODO: Add details to revision details model

    return true;
  }
}
