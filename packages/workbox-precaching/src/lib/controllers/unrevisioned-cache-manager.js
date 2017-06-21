import ErrorFactory from '../error-factory';
import BaseCacheManager from './base-cache-manager';
import RequestCacheEntry from '../models/precache-entries/request-entry';
import StringPrecacheEntry from
  '../models/precache-entries/string-cache-entry';
import {isInstance} from '../../../../../lib/assert';

/**
 * This class extends a lot of the internal methods from BaseCacheManager
 * to manage caching of unrevisioned assets.
 *
 * @private
 * @memberof module:workbox-precaching
 * @extends {module:workbox-precaching.BaseCacheManager}
 */
class UnrevisionedCacheManager extends BaseCacheManager {
  /**
   * Constructor for UnreivisionedCacheManager
   * @param {Object} input
   * @param {String} [input.cacheName] This is the cache name to store requested
   * assets.
   * @param {String} [input.cacheId] The cacheId can be used to ensure that
   * multiple projects sharing `http://localhost` have unique cache names.
   * @param {Array<Object>} [input.plugins] Any plugins that should be
   * invoked by the underlying `RequestWrapper`.
   */
   constructor(input = {}) {
     super(input);
  }

  /**
   * This method will add the entries to the install list.
   * This will manage duplicate entries and perform the caching during
   * the install step.
   *
   * @example
   *
   * unrevisionedManager.addToCacheList({
   *   unrevisionedFiles: [
   *     '/styles/hello.css',
   *     new Request('/images/logo.png', {
   *       // Custom Request Options.
   *     })
   *   ]
   * ]});
   *
   * @param {Array<String|Request>} rawEntries A raw entry that can be
   * parsed into a BaseCacheEntry.
   */
   addToCacheList({unrevisionedFiles} = {}) {
     isInstance({unrevisionedFiles}, Array);
     super._addEntries(unrevisionedFiles);
   }

  /**
   * This method ensures that the file entry in the maniest is valid and
   * can be parsed as a BaseCacheEntry.
   *
   * @private
   * @abstract
   * @param {String | Request} input Either a URL string or a Request.
   * @return {BaseCacheEntry} Returns a parsed version of the file entry.
   */
  _parseEntry(input) {
    if (typeof input === 'undefined' || input === null) {
      throw ErrorFactory.createError('invalid-unrevisioned-entry',
        new Error('Invalid file entry: ' + JSON.stringify(input)));
    }

    if (typeof input === 'string') {
      return new StringPrecacheEntry(input);
    } else if (input instanceof Request) {
      return new RequestCacheEntry(input);
    } else {
      throw ErrorFactory.createError('invalid-unrevisioned-entry',
        new Error('Invalid file entry: ' +
          JSON.stringify(input))
        );
    }
  }

  /**
   * @private
   * @param {BaseCacheEntry} newEntry The entry that is to be cached.
   * @param {BaseCacheEntry} previousEntry The entry that is currently cached.
   */
  _onDuplicateInstallEntryFound(newEntry, previousEntry) {
    // NOOP. Just ignore duplicate entries.
  }


  /**
   * We always want to override previously cached versions.
   * @private
   * @param {BaseCacheEntry} precacheEntry A file entry with `path` and
   * `revision` parameters.
   * @return {Promise<Boolean>} Returns true is the fileEntry is already
   * cached, false otherwise.
   */
  async _isAlreadyCached(precacheEntry) {
    return false;
  }

  /**
   * @private
   * @param {BaseCacheEntry} precacheEntry A file entry with `path` and
   * `revision` parameters.
   */
  _onEntryCached(precacheEntry) {
    // NOOP
  }

  /**
   * @private
   * @param {String} url The URL of the entry that was deleted.
   * @return {Promise} Returns a Promise that resolves once the work is done.
   */
  _onEntryDeleted(url) {
    // Effectively a no-op.
    return Promise.resolve();
  }
}

export default UnrevisionedCacheManager;
