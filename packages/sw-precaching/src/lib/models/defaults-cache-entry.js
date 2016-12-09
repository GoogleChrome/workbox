import ErrorFactory from '../error-factory';
import RevisionedCacheEntry from './revisioned-cache-entry.js';
import {cacheBustParamName} from '../constants';

/**
 * This method takes a file entry and if the `cacheBust` parameter is set to
 * true, the cacheBust parameter will be added to the URL before making the
 * request. The response will be cached with the absolute URL without
 * the cache busting search param.
 * @param {String} requestURL This is an object with `path`, `revision` and
 * `cacheBust` parameters.
 * @param {String} revision Revision to use in the cache bust.
 * @return {String} The final URL to make the request to then cache.
 */
const _cacheBustUrl = (requestURL, revision) => {
  const parsedURL = new URL(requestURL, location.origin);
  parsedURL.search += (parsedURL.search ? '&' : '') +
    encodeURIComponent(cacheBustParamName) + '=' +
    encodeURIComponent(revision);
  return parsedURL.toString();
};

class DefaultsCacheEntry extends RevisionedCacheEntry {
  constructor({revisionID, revision, request, cacheBust}) {
    // Check cacheBust type
    let filteredCacheBust = cacheBust;
    if (typeof filteredCacheBust === 'undefined') {
      filteredCacheBust = true;
    } else if (typeof filteredCacheBust !== 'boolean') {
      throw ErrorFactory.createError('invalid-file-manifest-entry',
        new Error('Bad CacheBust. It should be a boolean value: ' +
          JSON.stringify(cacheBust)));
    }

    // Check revision type
    if (typeof revision !== 'string' || revision.length === 0) {
      throw ErrorFactory.createError('invalid-file-manifest-entry',
        new Error('Bad Revision. It should be a string with at least ' +
          'one character: ' + JSON.stringify(revision)));
    }

    // Check request type
    if (!(request instanceof Request)) {
      if (typeof request === 'string') {
        request = new Request(_cacheBustUrl(request, revision));
      } else {
        throw ErrorFactory.createError('invalid-file-manifest-entry',
          new Error('Bad Request. It should be a string or a Request ' +
            'object: ' + JSON.stringify(request)));
      }
    } else if (cacheBust && cacheBust === true) {
      throw ErrorFactory.createError('invalid-file-manifest-entry',
        new Error('Bad Request + CacheBust Combo. Request URLs cannot ' +
          'have there URLs altered so must be cache busted in your ' +
          'servicework: ' + JSON.stringify(request)));
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
      revisionID,
      revision,
      request,
    });
  }
}

export default DefaultsCacheEntry;
