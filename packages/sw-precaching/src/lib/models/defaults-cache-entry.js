import ErrorFactory from '../error-factory';
import RevisionedCacheEntry from './revisioned-cache-entry.js';

class DefaultsCacheEntry extends RevisionedCacheEntry {
  constructor({revisionID, revision, request, cacheBust}) {
    // Check cacheBust is a boolean
    let filteredCacheBust = cacheBust;
    if (typeof filteredCacheBust === 'undefined') {
      filteredCacheBust = true;
    } else if (typeof filteredCacheBust !== 'boolean') {
      throw ErrorFactory.createError('invalid-file-manifest-entry',
        new Error('Bad CacheBust. It should be a boolean value: ' +
          JSON.stringify(cacheBust)));
    }

    // Check revision is a string with a length
    if (typeof revision !== 'string' || revision.length === 0) {
      throw ErrorFactory.createError('invalid-file-manifest-entry',
        new Error('Bad Revision. It should be a string with at least ' +
          'one character: ' + JSON.stringify(revision)));
    }

    // Check request is a string.
    if (typeof request !== 'string' || request.length === 0) {
      throw ErrorFactory.createError('invalid-file-manifest-entry',
        new Error('Bad Request. It should be a string:' +
          JSON.stringify(request)));
    }

    // Check revisionID type
    if (typeof revisionID === 'undefined') {
      revisionID = request.url;
    } else if (typeof revisionID !== 'string' || revisionID.length === 0) {
      throw ErrorFactory.createError('invalid-file-manifest-entry',
        new Error('Bad RevisionID. It should be a string with at least ' +
          'one character: ' + JSON.stringify(revisionID)));
    }

    super({
      revisionID: new URL(request, location.origin).toString(),
      revision,
      request: new Request(request),
      cacheBust,
    });
  }
}

export default DefaultsCacheEntry;
