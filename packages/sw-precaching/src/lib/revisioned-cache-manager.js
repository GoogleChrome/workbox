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
import {defaultCacheName, dbName, dbVersion, dbStorename}
  from './constants';

class RevisionedCacheManager {
  constructor() {
    this._eventsRegistered = false;
    this._cachedAssets = [];
    this._idbHelper = new IDBHelper(dbName, dbVersion, dbStorename);

    this._registerEvents();
  }

  cache({revisionedFiles} = {}) {
    assert.isInstance({revisionedFiles}, Array);

    const parsedFileList = revisionedFiles.map((revisionedFileEntry) => {
      let parsedFileEntry = revisionedFileEntry;
      if (typeof parsedFileEntry === 'string') {
        parsedFileEntry = {
          path: revisionedFileEntry,
          revision: revisionedFileEntry,
          cacheBust: true,
        };
      }

      if (!parsedFileEntry || typeof parsedFileEntry !== 'object') {
        throw ErrorFactory.createError('invalid-file-manifest-entry',
          new Error('Invalid file entry: ' +
            JSON.stringify(revisionedFileEntry)));
      }

      if (typeof parsedFileEntry.path !== 'string') {
        throw ErrorFactory.createError('invalid-file-manifest-entry',
          new Error('Invalid path: ' + JSON.stringify(revisionedFileEntry)));
      }

      try {
        parsedFileEntry.path =
          new URL(parsedFileEntry.path, location.origin).toString();
      } catch (err) {
        throw ErrorFactory.createError('invalid-file-manifest-entry',
          new Error('Unable to parse path as URL: ' +
            JSON.stringify(revisionedFileEntry)));
      }

      if (typeof parsedFileEntry.revision !== 'string' ||
        parsedFileEntry.revision.length == 0) {
        throw ErrorFactory.createError('invalid-file-manifest-entry',
          new Error('Invalid revision: ' +
            JSON.stringify(revisionedFileEntry)));
      }

      // Add cache bust if its not defined
      if (typeof parsedFileEntry.cacheBust === 'undefined') {
        parsedFileEntry.cached = true;
      } else if (typeof parsedFileEntry.cacheBust !== 'boolean') {
        throw ErrorFactory.createError('invalid-file-manifest-entry',
          new Error('Invalid cacheBust: ' +
            JSON.stringify(revisionedFileEntry)));
      }

      return parsedFileEntry;
    });

    this._cachedAssets = this._cachedAssets.concat(parsedFileList);
  }

  _registerEvents() {
    if (this._eventsRegistered) {
      // Only need to register events once.
      return;
    }

    this._eventsRegistered = true;

    self.addEventListener('install', (event) => {
      if (this._cachedAssets.length === 0) {
        return;
      }

      event.waitUntil(
        this._performInstallStep()
        .then(() => {
          this._close();
        })
      );
    });
  }

  _performInstallStep() {
    const assetsAndHahes = this._cachedAssets;
    const cacheId = null;
    if (!Array.isArray(assetsAndHahes)) {
      throw ErrorFactory.createError('assets-not-an-array');
    }

    const cacheName = cacheId || defaultCacheName;

    return caches.open(cacheName)
    .then((openCache) => {
      const cachePromises = assetsAndHahes.map((assetAndHash) => {
        return this._getRevisionDetails(assetAndHash.path)
        .then((previousRevisionDetails) => {
          if (previousRevisionDetails) {
            if (previousRevisionDetails === assetAndHash.revision) {
              /* eslint-disable no-console */
              console.log('    Already Cached? TODO: Need to check cache to ' +
                'ensure it\'s actually already cached.');
              /* eslint-enable no-console */
              return Promise.resolve();
            }
          }

          return openCache.add(new Request(assetAndHash.path, {
            credentials: 'same-origin',
          }))
          .then(() => {
            return this._putRevisionDetails(
              assetAndHash.path, assetAndHash.revision);
          });
        });
      });
      return Promise.all(cachePromises)
      .then(() => {
        return openCache.keys();
      })
      .then((openCacheKeys) => {
        const urlsCachedOnInstall = assetsAndHahes.map((assetAndHash) => {
          return assetAndHash.path;
        });

        const cacheDeletePromises = openCacheKeys.map((cachedRequest) => {
          if (!urlsCachedOnInstall.includes(cachedRequest.url)) {
            return openCache.delete(cachedRequest);
          }
          return Promise.resolve();
        });
        return Promise.all(cacheDeletePromises);
      });
    });
  }

  _getRevisionDetails(path) {
    return this._idbHelper.get(path);
  }

  _putRevisionDetails (path, revision) {
    return this._idbHelper.put(path, revision);
  }

  _close() {
    this._idbHelper.close();
  }
}

export default RevisionedCacheManager;
