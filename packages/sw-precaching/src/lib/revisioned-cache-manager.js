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
import installHandler from './install-handler';
import ErrorFactory from './error-factory';

class RevisionedCacheManager {
  constructor() {
    this._eventsRegistered = false;
    this._cachedAssets = [];

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

    /**

    let parsedUrl = null;
    let parsedRevision = null;
    let cacheBust = true;

    if (typeof revisionedFile === 'string') {
      try {
        parsedUrl = ;
      } catch (err) {
        // NOOP
      }

      parsedRevision = parsedUrl;
      cacheBust = false;
    } else if (revisionedFile && typeof revisionedFile === 'object' &&
      typeof revisionedFile.path === 'string' &&
      typeof revisionedFile.revision === 'string' &&
      revisionedFile.length > 0
    ) {
      try {
        parsedUrl = new URL(revisionedFile.path, location.origin).toString();
      } catch (err) {
        // NOOP
      }

      parsedRevision = revisionedFile.revision;

      if (typeof revisionedFile.cacheBust === 'boolean') {
          cacheBust = revisionedFile.cacheBust;
      } else if (typeof revisionedFile.cachebust !== 'undefined') {
        throw ErrorFactory.createError('bad-cache-bust');
      }
    }

    if (
      typeof parsedUrl !== 'string' ||
      typeof parsedRevision !== 'string'
    ) {
    throw ErrorFactory.createError('invalid-file-manifest-entry',
      new Error('Invalid path: ' + JSON.stringify(revisionedFile)));
    }

    return {path: parsedUrl, revision: parsedRevision, cacheBust};


     */

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
        installHandler({assetsAndHahes: this._cachedAssets})
      );
    });
  }
}

export default RevisionedCacheManager;
