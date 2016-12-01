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

class RevisionedCacheManager {
  constructor() {
    this._eventsRegistered = false;
    this._cachedAssets = [];
  }

  cache({revisionedFiles} = {}) {
    assert.isInstance({revisionedFiles}, Array);

    const parsedFileList = revisionedFiles.map((revisionedFile) => {
      if (typeof revisionedFile === 'string') {
        return {path: revisionedFile, revision: revisionedFile};
      } else {
        // TODO Check revisionedFile.path and revisionedFile.revision
        return revisionedFile;
      }
    });

    this._cachedAssets = this._cachedAssets.concat(parsedFileList);

    this._registerEvents();
  }

  _registerEvents() {
    if (this._eventsRegistered) {
      // Only need to register events once.
      return;
    }

    this._eventsRegistered = true;

    self.addEventListener('install', (event) => {
      event.waitUntil(
        installHandler({assetsAndHahes: this._cachedAssets})
      );
    });
  }
}

export default RevisionedCacheManager;
