import BaseCacheEntry from './base-precache-entry';
import {isType} from '../../../../../../lib/assert';
import WorkboxError from '../../../../../../lib/workbox-error';

/**
 * This class will take a string and parse it as a BaseCacheEntry.
 *
 * @private
 * @memberof module:workbox-precaching
 * @extends {module:workbox-precaching.BaseCacheEntry}
 */
class StringCacheEntry extends BaseCacheEntry {
  /**
   * Cosntructor for StringCacheEntry.
   *
   * @param {String} url A URL to cache.
   */
  constructor(url) {
    isType({url}, 'string');
    if (url.length === 0) {
      throw new WorkboxError('invalid-string-entry', {
        url,
      });
    }

    super({
      entryID: url,
      revision: url,
      request: new Request(url),
      cacheBust: false,
    });
  }
}

export default StringCacheEntry;
