import BaseCacheManager from './base-cache-manager';
import RevisionDetailsModel from '../models/revision-details-model';
import {defaultRevisionedCacheName} from '../constants';
import StringCacheEntry from
  '../models/precache-entries/string-cache-entry';
import ObjectPrecacheEntry from
  '../models/precache-entries/object-precache-entry';
import {isInstance} from '../../../../../lib/assert';
import logHelper from '../../../../../lib/log-helper';
import WorkboxError from '../../../../../lib/workbox-error';

/**
 * You can instantiate this class to add requests to a precache list and
 * eventually install the assets by calling [install()]{@link
 * module:workbox-precaching.BaseCacheManager#install} and to remove
 * old entries call [cleanup()]{@link
 *  module:workbox-precaching.RevisionedCacheManager#cleanup}.
 *
 * @memberof module:workbox-precaching
 * @extends module:workbox-precaching.BaseCacheManager
 */
class RevisionedCacheManager extends BaseCacheManager {
  /**
   * Constructs a new RevisionedCacheManager to handle caching of revisioned
   * assets only.
   *
   * @param {Object} input
   * @param {String} [input.cacheName] The cache to be used for precaching.
   * @param {String} [input.cacheId] The cacheId is prepended to the
   * cache name. This is useful if you have multiple projects sharing
   * the same `http://localhost` origin and want unique cache names.
   * @param {Array<Object>} [input.plugins] Any plugins that should be
   * invoked by the underlying `RequestWrapper`.
   */
  constructor(input = {}) {
    input.cacheName = input.cacheName || defaultRevisionedCacheName;

    super(input);

    this._revisionDetailsModel = new RevisionDetailsModel();
  }

  /**
   * This method will add the supplied entries to the install list and
   * can be called multiple times.
   *
   * The `revisionedFiles` parameter of the input should contain an array
   * of objects or strings.
   *
   * Objects in this array should have a `url` and `revision` parameter where
   * the revision is a hash, unique to the files contents, which changes
   * whenever the file is updated. (See our [getting started guide to learn
   * how to automate this](/#get-started)).
   *
   * Strings should be URL's that contain revisioning information
   * i.e. `/styles/main.abcd.css` instead of `/styles/main.css`. If you supply
   * a URL which *isn't* revisioned, the `install()` step will **never** update
   * the precached asset.
   *
   * @param {Object} input
   * @param {Array<String|Object>} input.revisionedFiles This should be an
   * array of either objects or strings.
   *
   * @example
   * revisionedManager.addToCacheList({
   *   revisionedFiles: [
   *     '/styles/hello.1234.css',
   *     {
   *       url: '/images/logo.png',
   *       revision: 'abcd1234'
   *     }
   *   ]
   * });
   */
  addToCacheList({revisionedFiles} = {}) {
    isInstance({revisionedFiles}, Array);
    super._addEntries(revisionedFiles);

    const urlsWithoutRevisionFields = revisionedFiles
      .filter((entry) => typeof entry === 'string');
    if (urlsWithoutRevisionFields.length > 0) {
      logHelper.debug({
        that: this,
        message: `Some precache entries are URLs without separate revision
          fields. If the URLs themselves do not contain revisioning info,
          like a hash or a version number, your users won't receive updates.`,
        data: {
          'URLs without revision fields':
            JSON.stringify(urlsWithoutRevisionFields),
          'Examples of safe, versioned URLs':
            `'/path/file.abcd1234.css' or '/v1.0.0/file.js'`,
          'Examples of dangerous, unversioned URLs':
            `'index.html' or '/path/file.css' or '/latest/file.js'`,
        },
      });
    }
  }

  /**
   * This method ensures that the file entry in the maniest is valid and
   * can be parsed as a BaseCacheEntry.
   *
   * @private
   * @abstract
   * @param {String | Object} input Either a URL string
   * or an object with a `url`, `revision` and optional `cacheBust` parameter.
   * @return {BaseCacheEntry} Returns a parsed version of the file entry.
   */
  _parseEntry(input) {
    if (input === null) {
      throw new WorkboxError('unexpected-precache-entry', {input});
    }

    let precacheEntry;
    switch (typeof input) {
      case 'string':
        precacheEntry = new StringCacheEntry(input);
        break;
      case 'object':
        precacheEntry = new ObjectPrecacheEntry(input);
        break;
      default:
        throw new WorkboxError('unexpected-precache-entry', {input});
    }

    return precacheEntry;
  }

  /**
   * If a dupe entry exists, check the revision. If the revisions are the same
   * it's simply a duplicate entry. If they are different, we have two
   * identical requests with two different revisions which will put this
   * module into a bad state.
   *
   * @private
   * @param {BaseCacheEntry} newEntry The entry that is to be cached.
   * @param {BaseCacheEntry} previousEntry The entry that is currently cached.
   */
  _onDuplicateInstallEntryFound(newEntry, previousEntry) {
    if (previousEntry.revision !== newEntry.revision) {
      throw new WorkboxError('duplicate-entry-diff-revisions', {
        firstEntry: {
          url: previousEntry.request.url,
          revision: previousEntry.revision,
        },
        secondEntry: {
          url: newEntry.request.url,
          revision: newEntry.revision,
        },
      });
    }
  }

  /**
   * This method confirms with a precacheEntry is already in the cache with the
   * appropriate revision.
   * If the revision is known, the requested `precacheEntry.revision` is saved
   * and the cache entry exists for the `precacheEntry.path` this method
   * will return true.
   *
   * @private
   * @param {BaseCacheEntry} precacheEntry A entry with `path` and `revision`
   * parameters.
   * @return {Promise<Boolean>} Returns true if the precacheEntry is already
   * cached, false otherwise.
   */
  async _isAlreadyCached(precacheEntry) {
    const revisionDetails = await
      this._revisionDetailsModel.get(precacheEntry.entryID);
    if (revisionDetails !== precacheEntry.revision) {
      return false;
    }

    const openCache = await this._getCache();
    const cachedResponse = await openCache.match(precacheEntry.request);
    return cachedResponse ? true : false;
  }

  /**
   * @private
   * @param {BaseCacheEntry} precacheEntry A file entry with `path` and
   * `revision` parameters.
   */
  async _onEntryCached(precacheEntry) {
    await this._revisionDetailsModel.put(
      precacheEntry.entryID, precacheEntry.revision);
  }

  /**
   * Removes a URL from IndexedDB when the corresponding entry has been removed
   * from the Cache Storage API.
   *
   * @private
   * @param {String} url The URL that has been deleted from the cache.
   */
  async _onEntryDeleted(url) {
    await this._revisionDetailsModel.delete(url);
  }

  /**
   * This method closes the indexdDB helper. This is used for unit testing
   * to ensure cleanup between tests.
   * @private
   */
  _close() {
    this._revisionDetailsModel._close();
  }

  /**
   * This method will compare the currently cached requests's and determine
   * which requests are no longer in the cache list and can be removed from the
   * cache.
   *
   * This should be called in a service worker's activate event to avoid
   * removing requests that are still be used by currently open pages.
   *
   * @return {Promise} Promise that resolves once the cache entries have been
   * cleaned.
   */
  cleanup() {
    return super.cleanup()
    .then(() => {
      return this._close();
    });
  }
}

export default RevisionedCacheManager;
