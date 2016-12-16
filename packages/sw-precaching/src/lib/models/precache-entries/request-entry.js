import RevisionedCacheEntry from './base-precache-entry.js';

class RequestCacheEntry extends RevisionedCacheEntry {
  constructor(request) {
    super({
      entryID: request.url,
      request: request,
      cacheBust: false,
    });
  }
}

export default RequestCacheEntry;
