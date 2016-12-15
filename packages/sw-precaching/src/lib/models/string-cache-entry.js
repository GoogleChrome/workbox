import RevisionedCacheEntry from './revisioned-cache-entry.js';

class StringCacheEntry extends RevisionedCacheEntry {
  constructor({fileEntry}) {
    super({
      revisionID: fileEntry,
      revision: fileEntry,
      request: new Request(fileEntry),
      cacheBust: false,
    });
  }
}

export default StringCacheEntry;
