import ErrorFactory from '../error-factory';
import BaseCacheManager from './base-manager';
import RevisionDetailsModel from '../models/revision-details-model';
import {defaultRevisionedCacheName} from '../constants';
import StringPrecacheEntry from
  '../models/precache-entries/string-precache-entry';
import ObjectPrecacheEntry from
  '../models/precache-entries/object-precache-entry';

class RevisionedManger extends BaseCacheManager {
  constructor() {
    super(defaultRevisionedCacheName);

    this._revisionDetailsModel = new RevisionDetailsModel();
  }

  /**
   * This method ensures that the file entry in the maniest is valid and
   * if the entry is a revisioned string path, it is converted to an object
   * with the desired fields.
   * @param {String | object} input Either a URL string or an object
   * with a `url`, `revision` and optional `cacheBust` parameter.
   * @return {object} Returns a parsed version of the file entry with absolute
   * URL, revision and a cacheBust value.
   */
  _parseEntry(input) {
    if (typeof input === 'undefined' || input === null) {
      throw ErrorFactory.createError('invalid-revisioned-entry',
        new Error('Invalid file entry: ' + JSON.stringify(input)));
    }

    let precacheEntry;
    switch(typeof input) {
      case 'string':
        precacheEntry = new StringPrecacheEntry(input);
        break;
      case 'object':
        precacheEntry = new ObjectPrecacheEntry(input);
        break;
      default:
        throw ErrorFactory.createError('invalid-revisioned-entry',
          new Error('Invalid file entry: ' +
            JSON.stringify(precacheEntry)));
    }

    return precacheEntry;
  }

  _onDuplicateEntryFound(newEntry, previousEntry) {
    // If entry exists, check the revision. If the revisions are the same
    // it's simply a duplicate entry. If they are different, we have two
    // identical requests with two different revisions which will put this
    // module into a bad state.
    if (previousEntry.revision !== newEntry.revision) {
      throw ErrorFactory.createError(
        'duplicate-entry-diff-revisions',
        new Error(`${JSON.stringify(previousEntry)} <=> ` +
          `${JSON.stringify(newEntry)}`),
      );
    }
  }

  /**
   * This method confirms with a fileEntry is already in the cache with the
   * appropriate revision.
   * If the revision is known, matching the requested `fileEntry.revision` and
   * the cache entry exists for the `fileEntry.path` this method returns true.
   * False otherwise.
   * @param {Object} fileEntry A file entry with `path` and `revision`
   * parameters.
   * @return {Promise<Boolean>} Returns true is the fileEntry is already
   * cached, false otherwise.
   */
  async _isAlreadyCached(fileEntry) {
    const revisionDetails = await
      this._revisionDetailsModel.get(fileEntry.entryID);
    if (revisionDetails !== fileEntry.revision) {
      return false;
    }

    const openCache = await this._getCache();
    const cachedResponse = await openCache.match(fileEntry.request);
    return cachedResponse ? true : false;
  }

  async _onEntryCached(precacheEntry) {
    await this._revisionDetailsModel.put(
      precacheEntry.entryID, precacheEntry.revision);
  }

  /**
   * This method closes the indexdDB helper.
   */
  _close() {
    this._revisionDetailsModel._close();
  }
}

export default RevisionedManger;
