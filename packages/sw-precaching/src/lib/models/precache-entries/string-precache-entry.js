import RevisionedCacheEntry from './base-precache-entry.js';

class StringCacheEntry extends RevisionedCacheEntry {
  constructor(input) {
    super({
      entryID: input,
      revision: input,
      request: new Request(input),
      cacheBust: false,
    });
  }
}

export default StringCacheEntry;
