/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

// SyncManager
// https://wicg.github.io/BackgroundSync/spec/#sync-manager-interface
class SyncManager {
  constructor() {
    this._tagList = new Set();
  }
  async register(tagName) {
    this._tagList.add(tagName);
    return Promise.resolve();
  }
  async getTags() {
    return Promise.resolve([...this._tagList]);
  }
}

module.exports = SyncManager;
