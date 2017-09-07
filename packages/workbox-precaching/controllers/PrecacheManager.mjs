import {_private} from 'workbox-core';
import core from 'workbox-core';

import PrecacheEntry from '../models/PrecacheEntry.mjs';
import showWarningsIfNeeded from '../utils/showWarningsIfNeeded.mjs';

/**
 * Performs efficient precaching of assets.
 */
export default class PrecacheManager {
  /**
   * Create a new PrecacheManager Instance
   */
  constructor() {
    this._entriesToCacheMap = new Map();
    if (process.env.NODE_ENV !== 'prod') {
      this.checkEntryRevisioning = true;
    }
  }

  /**
   * This method will add items to the precache list, removing duplicates
   * and ensuring the information is valid.
   * @param {Array<object|string>} userEntries Array of entries to
   * precache.
   */
  addToCacheList(userEntries) {
    if (process.env.NODE_ENV !== 'prod') {
      core.assert.isArray(userEntries, {
        moduleName: 'workbox-precaching',
        className: 'PrecacheManager',
        funcName: 'addToCacheList',
        paramName: 'userEntries',
      });
    }

    userEntries.map((userEntry) => {
      this._addEntryToCacheList(
        this._parseEntry(userEntry)
      );
    });

    if (process.env.NODE_ENV !== 'prod' &&
      this.checkEntryRevisioning === true) {
      showWarningsIfNeeded(userEntries);
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
    const existingEntry = this._entriesToCacheMap.get(entryToAdd.entryId);
    if (!existingEntry) {
      this._entriesToCacheMap.set(entryToAdd.entryId, entryToAdd);
      return;
    }

    // Duplicates are fine, but make sure the revision information
    // is the same.
    if (existingEntry.revision !== entryToAdd.revision) {
      throw new _private.WorkboxError('add-to-cache-list-conflicting-entries', {
        firstEntry: existingEntry.originalInput,
        secondEntry: entryToAdd.originalInput,
      });
    }
  }
}
