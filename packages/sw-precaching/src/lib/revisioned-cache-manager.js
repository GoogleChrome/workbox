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
import IDBHelper from '../../../../lib/idb-helper.js';
import StringCacheEntry from './models/string-cache-entry.js';
import DefaultsCacheEntry from './models/defaults-cache-entry.js';
import {defaultCacheName, dbName, dbVersion, dbStorename}
  from './constants';

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
    this._fileEntriesToCache = {};
    this._idbHelper = new IDBHelper(dbName, dbVersion, dbStorename);

    this._registerEvents();
  }

  /**
   * The method expects an array of file entries in the revisionedFiles
   * parameter. Each fileEntry should be either a string or an object.
   *
   * A string file entry should be paths / URL's that are revisions in the
   * name (i.e. '/example/hello.1234.txt').
   *
   * A file entry can also be an object that *must* have a 'path' and
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
      if (!this._fileEntriesToCache[fileEntry.revisionID]) {
        // Only cache new entries.
        this._fileEntriesToCache[fileEntry.revisionID] = fileEntry;
        return;
      }

      // If entry exists, ensure the revision is different
      const previousEntry = this._fileEntriesToCache[fileEntry.revisionID];
      if (previousEntry.revision !== fileEntry.revision) {
        throw ErrorFactory.createError(
          'duplicate-entry-diff-revisions',
          new Error(`${JSON.stringify(previousEntry)} <=> ` +
            `${JSON.stringify(fileEntry)}`),
        );
      }
    });
  }

  /**
   * This method ensures that the file entry in the file maniest is valid and
   * if the entry is a revisioned string path, it is converted to an object
   * with the desired fields.
   * @param {String | object} input Either a path for a file or an object
   * with a `path`, `revision` and optional `cacheBust` parameter.
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

    /** if (parsedFileEntry &&
      parsedFileEntry.path && typeof parsedFileEntry.path === 'string') {
      try {
        const absUrl =
          new URL(parsedFileEntry.path, location.origin).toString();
        parsedFileEntry.path = new Request(absUrl);
      } catch (err) {
        throw ErrorFactory.createError('invalid-file-manifest-entry',
          new Error('Unable to parse path as URL: ' +
            JSON.stringify(fileEntry)));
      }
    }

    if (!parsedFileEntry || typeof parsedFileEntry !== 'object') {

    }

    if (!(parsedFileEntry.path instanceof Request)) {
      throw ErrorFactory.createError('invalid-file-manifest-entry',
        new Error('Invalid path: ' + JSON.stringify(fileEntry)));
    }

    if (typeof parsedFileEntry.revision !== 'string' ||
      parsedFileEntry.revision.length == 0) {
      throw ErrorFactory.createError('invalid-file-manifest-entry',
        new Error('Invalid revision: ' +
          JSON.stringify(fileEntry)));
    }

    // Add cache bust if its not defined
    if (typeof parsedFileEntry.cacheBust === 'undefined') {
      parsedFileEntry.cacheBust = true;
    } else if (typeof parsedFileEntry.cacheBust !== 'boolean') {
      throw ErrorFactory.createError('invalid-file-manifest-entry',
        new Error('Invalid cacheBust: ' +
          JSON.stringify(fileEntry)));
    }

    if (fileEntry.revisionID && typeof fileEntry.revisionID !== 'string') {
      throw ErrorFactory.createError('invalid-file-manifest-entry',
        new Error('Invalid revisionID: ' +
          JSON.stringify(fileEntry)));
    }

    let revisionID = parsedFileEntry.path.url;
    if (fileEntry.revisionID) {
      revisionID = fileEntry.revisionID;
    }
    parsedFileEntry.revisionID = revisionID;

    return parsedFileEntry;**/
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
      if (this._fileEntriesToCache.length === 0) {
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
  }

  /**
   * This method manages the actual install event to cache the revisioned
   * assets.
   * @param {String} cacheName The name to use for the cache
   * @return {Promise} The promise resolves when all the desired assets are
   * cached.
   */
  async _performInstallStep(cacheName) {
    cacheName = cacheName || defaultCacheName;

    let openCache = await caches.open(cacheName);
    const fileEntriesToCache = Object.values(this._fileEntriesToCache);
    const cachePromises = fileEntriesToCache.map(async (fileEntry) => {
      const isCached = await this._isAlreadyCached(fileEntry, openCache);
      if (isCached) {
        return;
      }

      let response = null;
      try {
        response = await fetch(fileEntry.request, {
          credentials: 'same-origin',
        });
      } catch (err) {
        throw err;
      }

      if (response.ok) {
        await openCache.put(fileEntry.request, response);

        await this._putRevisionDetails(
          fileEntry.revisionID, fileEntry.revision);
      } else {
        throw ErrorFactory.createError('request-not-cached', {
          message: `Failed to get a cacheable response for ` +
            `'${fileEntry.request.url}'`,
        });
      }
    });

    await Promise.all(cachePromises);

    const requestsCachedOnInstall = fileEntriesToCache
      .map((fileEntry) => fileEntry.request.url);
    const allCachedRequests = await openCache.keys();

    const cacheDeletePromises = allCachedRequests.map((cachedRequest) => {
      if (requestsCachedOnInstall.includes(cachedRequest.url)) {
        return;
      }

      return openCache.delete(cachedRequest);
    });

    await Promise.all(cacheDeletePromises);
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
      this._getRevisionDetails(fileEntry.revisionID);
    if (revisionDetails !== fileEntry.revision) {
      return false;
    }

    const cachedResponse = await openCache.match(fileEntry.request);
    return cachedResponse ? true : false;
  }

  /**
   * This method gets the revision details for a given path.
   * @param {String} path The path of an asset to look up.
   * @return {Promise<String|null>} Returns a string for the last revision or
   * returns null if there is no revision information.
   */
  _getRevisionDetails(path) {
    return this._idbHelper.get(path);
  }

  /**
   * This method saves the revision details to indexedDB.
   * @param {String} path The path for the asset.
   * @param {String} revision The current revision for this asset path.
   * @return {Promise} Promise that resolves once the data has been saved.
   */
  _putRevisionDetails(path, revision) {
    return this._idbHelper.put(path, revision);
  }

  /**
   * This method closes the indexdDB helper.
   */
  _close() {
    this._idbHelper.close();
  }
}

export default RevisionedCacheManager;
