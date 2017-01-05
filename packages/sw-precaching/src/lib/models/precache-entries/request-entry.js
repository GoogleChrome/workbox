import BaseCacheEntry from './base-precache-entry';
import ErrorFactory from '../../error-factory';

/**
 * This class will take a Request object and parse it into a BaseCacheEntry.
 *
 * @private
 * @memberof module:sw-precaching
 * @extends {module:sw-precaching.BaseCacheEntry}
 */
class RequestCacheEntry extends BaseCacheEntry {
  /**
   * This is useful for caching unrevisioned requests that require
   * special headers etc.
   * @param {Request} request A request to be cached.
   */
  constructor(request) {
    if (!(request instanceof Request)) {
      throw ErrorFactory.createError('invalid-unrevisioned-entry',
        new Error('Invalid file entry: ' +
          JSON.stringify(request)));
    }

    super({
      entryID: request.url,
      request: request,
      cacheBust: false,
    });
  }
}

export default RequestCacheEntry;
