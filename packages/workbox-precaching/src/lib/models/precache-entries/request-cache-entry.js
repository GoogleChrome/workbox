import BaseCacheEntry from './base-precache-entry';
import WorkboxError from '../../../../../../lib/workbox-error';

/**
 * This class will take a Request object and parse it into a BaseCacheEntry.
 *
 * @private
 * @memberof module:workbox-precaching
 * @extends {module:workbox-precaching.BaseCacheEntry}
 */
class RequestCacheEntry extends BaseCacheEntry {
  /**
   * This is useful for caching unrevisioned requests that require
   * special headers etc.
   * @param {Request} request A request to be cached.
   */
  constructor(request) {
    if (!(request instanceof Request)) {
      throw new WorkboxError('invalid-request-entry', {
        url: request.url,
      });
    }

    super({
      entryID: request.url,
      request: request,
      cacheBust: false,
    });
  }
}

export default RequestCacheEntry;
