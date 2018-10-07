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
