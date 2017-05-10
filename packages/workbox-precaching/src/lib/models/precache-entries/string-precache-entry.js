import ErrorFactory from '../../error-factory';
import BaseCacheEntry from './base-precache-entry';
import assert from '../../../../../../lib/assert';

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
    assert.isType({url}, 'string');
    if (url.length === 0) {
      throw ErrorFactory.createError('invalid-revisioned-entry',
        new Error('Bad url Parameter. It should be a string:' +
          JSON.stringify(url)));
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
