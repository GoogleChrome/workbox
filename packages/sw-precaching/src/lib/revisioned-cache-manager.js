/*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

import assert from '../../../../lib/assert';
import ErrorFactory from './error-factory';
import StringCacheEntry from './models/string-cache-entry.js';
import DefaultsCacheEntry from './models/defaults-cache-entry.js';
import RevisionDetailsModel from './models/revision-details-model.js';
import {defaultCacheName} from './constants';

/**
 * RevisionedCacheManager manages efficient caching of a file manifest,
 * only downloading assets that have a new file revision. This module will
 * also manage Cache Busting for URL's by adding a search a parameter on to
 * the end of requests for assets before caching them.
 */
class RevisionedCacheManager {
  /**
   * Constructing this object will register the require events for this
   * module to work (i.e. install and activate events).
   */
  constructor() {
    this._eventsRegistered = false;
    this._installCacheList = {};
    this._revisionDetailsModel = new RevisionDetailsModel();

    this._registerEvents();
  }

  /**
   * The method expects an array of file entries in the revisionedFiles
   * parameter. Each fileEntry should be either a string or an object.
   *
   * If the entry is a string, the URL should be revisioned like
   * '/example/hello.1234.txt' for example is revisioned by '1234'.
   *
   * If the entry is an object, it *must* have a 'url' and
   * 'revision' parameter. The revision cannot be an empty string. With These
   * entries you can prevent cacheBusting by setting a 'cacheBust' parameter
   * to false. (i.e. {path: '/exmaple/hello.txt', revision: '1234'} or
   * {path: '/exmaple/hello.txt', revision: '1234', cacheBust: false})
   *
   * @param {object} options
   * @param {array<object>} options.revisionedFiles This should a list of
   * file entries.
   */
  cache({revisionedFiles} = {}) {
    assert.isInstance({revisionedFiles}, Array);

    revisionedFiles.forEach((revisionedFileEntry) => {
      const fileEntry = this._validateFileEntry(revisionedFileEntry);
      this._addFileEntryToInstallList(fileEntry);
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
  _validateFileEntry(input) {
    if (typeof input === 'undefined' || input === null) {
      throw ErrorFactory.createError('invalid-file-manifest-entry',
        new Error('Invalid file entry: ' + JSON.stringify(input)));
    }

    let fileEntry;
    switch(typeof input) {
      case 'string': {
        fileEntry = new StringCacheEntry({fileEntry: input});
        break;
      }
      case 'object': {
        fileEntry = new DefaultsCacheEntry(input);
        break;
      }
      default: {
        throw ErrorFactory.createError('invalid-file-manifest-entry',
          new Error('Invalid file entry: ' +
            JSON.stringify(fileEntry)));
      }
    }

    return fileEntry;
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
  _addFileEntryToInstallList(fileEntry) {
    const revisionID = fileEntry.revisionID;
    const previousEntry = this._installCacheList[fileEntry.revisionID];

    // If entry exists, check the revision. If the revisions are the same
    // it's simply a duplicate entry. If they are different, we have two
    // identical requests with two different revisions which will put this
    // module into a bad state.
    if (previousEntry) {
      if (previousEntry.revision !== fileEntry.revision) {
        throw ErrorFactory.createError(
          'duplicate-entry-diff-revisions',
          new Error(`${JSON.stringify(previousEntry)} <=> ` +
            `${JSON.stringify(fileEntry)}`),
        );
      }
    } else {
      // This entry isn't in the install list
      this._installCacheList[revisionID] = fileEntry;
    }
  }

  /**
   * This method registers the service worker events. This should only
   * be called once in the constructor and will do nothing if called
   * multiple times.
   */
  _registerEvents() {
    if (this._eventsRegistered) {
      // Only need to register events once.
      return;
    }

    this._eventsRegistered = true;

    self.addEventListener('install', (event) => {
      if (this._installCacheList.length === 0) {
        return;
      }

      event.waitUntil(
        this._performInstallStep()
        .then(() => {
          // Closed indexedDB now that we are done with the install step
          this._close();
        })
        .catch((err) => {
          this._close();

          throw err;
        })
      );
    });

    self.addEventListener('activate', (event) => {
      event.waitUntil(
        this._cleanUpOldEntries()
        .then(() => {
          // Closed indexedDB now that we are done with the install step
          this._close();
        })
        .catch((err) => {
          this._close();

          throw err;
        })
      );
    });
  }

  /**
   * A simple helper method to get the cache used for precaching assets.
   * @return {Cache} The cache to be used for precaching.
   */
  _getCache() {
    return caches.open(defaultCacheName);
  }

  /**
   * This method manages the actual install event to cache the revisioned
   * assets.
   * @return {Promise} The promise resolves when all the desired assets are
   * cached.
   */
  async _performInstallStep(cacheName) {
    let openCache = await this._getCache();

    const entriesToCache = Object.values(this._installCacheList);
    const cachePromises = entriesToCache.map(async (fileEntry) => {
      return this._cacheRevisionedEntry(fileEntry, openCache);
    });

    // Wait for all requests to be cached.
    await Promise.all(cachePromises);
  }

  /**
   * Once the install event has occured and the previous entries need
   * to be deleted from the cache, this method will compare the URL's
   * and figure out which assets are no longer required to be precached.
   */
  async _cleanUpOldEntries() {
    const requestsCachedOnInstall = Object.values(this._installCacheList)
      .map((fileEntry) => fileEntry.request.url);

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


  /**
   * This method will take a file entry, cache it and add the revision details
   * to the RevisionDetailsModel.
   * @param {RevisionCacheEntry} fileEntry
   * @param {Cache} openCache
   * @return {Promise} Resolves once the entry is cached and details are
   * stored by REvisionDetailsModel.
   */
  async _cacheRevisionedEntry(fileEntry, openCache) {
    const isCached = await this._isAlreadyCached(fileEntry, openCache);
    if (isCached) {
      return;
    }

    let response = await fetch(fileEntry.cacheBustRequest, {
        credentials: 'same-origin',
      });

    if (response.ok) {
      await openCache.put(fileEntry.request, response);

      await this._revisionDetailsModel.put(
        fileEntry.revisionID, fileEntry.revision);
    } else {
      throw ErrorFactory.createError('request-not-cached', {
        message: `Failed to get a cacheable response for ` +
          `'${fileEntry.request.url}'`,
      });
    }
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
      this._revisionDetailsModel.get(fileEntry.revisionID);
    if (revisionDetails !== fileEntry.revision) {
      return false;
    }

    const cachedResponse = await openCache.match(fileEntry.request);
    return cachedResponse ? true : false;
  }

  /**
   * This method closes the indexdDB helper.
   */
  _close() {
    this._revisionDetailsModel._close();
  }
}

export default RevisionedCacheManager;
