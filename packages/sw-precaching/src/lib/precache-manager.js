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
import RevisionedCacheManager from './controllers/revisioned-manager.js';
import UnrevisionedCacheManager from './controllers/unrevisioned-manager.js';

class PrecacheManager {
  constructor() {
    this._eventsRegistered = false;
    this._revisionedManager = new RevisionedCacheManager();
    this._unrevisionedManager = new UnrevisionedCacheManager();
    this._registerEvents();
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
      const promiseChain = Promise.all([
        this._revisionedManager._performInstallStep(),
        this._unrevisionedManager._performInstallStep(),
      ])
      .then(() => {
        // Closed indexedDB now that we are done with the install step
        this._close();
      })
      .catch((err) => {
        this._close();

        throw err;
      });

      event.waitUntil(promiseChain);
    });

    self.addEventListener('activate', (event) => {
      const promiseChain = Promise.all([
        this._revisionedManager._cleanUpOldEntries(),
        this._unrevisionedManager._cleanUpOldEntries(),
      ])
      .then(() => {
        // Closed indexedDB now that we are done with the install step
        this._close();
      })
      .catch((err) => {
        this._close();

        throw err;
      });

      event.waitUntil(promiseChain);
    });
  }

  cacheRevisioned({revisionedFiles} = {}) {
    assert.isInstance({revisionedFiles}, Array);
    this._revisionedManager.cache(revisionedFiles);
  }

  cacheUnrevisioned({unrevisionedFiles} = {}) {
    assert.isInstance({unrevisionedFiles}, Array);
    this._unrevisionedManager.cache(unrevisionedFiles);
  }

  _close() {
    this._revisionedManager._close();
  }
}

export default PrecacheManager;
