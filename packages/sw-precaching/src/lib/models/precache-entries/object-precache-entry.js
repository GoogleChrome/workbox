import ErrorFactory from '../../error-factory';
import RevisionedCacheEntry from './base-precache-entry.js';

class DefaultsCacheEntry extends RevisionedCacheEntry {
  constructor({entryID, revision, url, cacheBust}) {
    // Check cacheBust is a boolean
    let filteredCacheBust = cacheBust;
    if (typeof filteredCacheBust === 'undefined') {
      filteredCacheBust = true;
    } else if (typeof filteredCacheBust !== 'boolean') {
      throw ErrorFactory.createError('invalid-revisioned-entry',
        new Error('Bad cacheBust Parameter. It should be a boolean value: ' +
          JSON.stringify(cacheBust)));
    }

    // Check revision is a string with a length
    if (typeof revision !== 'string' || revision.length === 0) {
      throw ErrorFactory.createError('invalid-revisioned-entry',
        new Error('Bad revision Parameter. It should be a string with at ' +
          'least one character: ' + JSON.stringify(revision)));
    }

    // Check url is a string.
    if (typeof url !== 'string' || url.length === 0) {
      throw ErrorFactory.createError('invalid-revisioned-entry',
        new Error('Bad url Parameter. It should be a string:' +
          JSON.stringify(url)));
    }

    // Check entryID type
    if (typeof entryID === 'undefined') {
      entryID = new URL(url, location.origin).toString();
    } else if (typeof entryID !== 'string' || entryID.length === 0) {
      throw ErrorFactory.createError('invalid-revisioned-entry',
        new Error('Bad entryID Parameter. It should be a string with at ' +
          'least one character: ' + JSON.stringify(entryID)));
    }

    super({
      entryID,
      revision,
      request: new Request(url),
      cacheBust,
    });
  }
}

export default DefaultsCacheEntry;
