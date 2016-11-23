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

class RevisionedCacheManager {
  constructor() {
    this._eventsRegistered = false;
  }

  cache({revisionedFiles} = {}) {
    assert.isInstance({revisionedFiles: revisionedFiles}, Array);
    // this._registerEvents();
  }

  _registerEvents() {
    if (this._eventsRegistered) {
      // Only need to register events once.
      return;
    }

    self.addEventListener('install', function() {
      console.log('Install event fired');
    });

    self.addEventListener('activate', function() {
      console.log('activate event fired');
    });
  }
}

export default RevisionedCacheManager;
