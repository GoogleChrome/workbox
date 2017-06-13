import WorkboxError from '../../../../../../lib/workbox-error';
import BaseCacheEntry from './base-precache-entry';
import {isType} from '../../../../../../lib/assert';

/**
 * This class will take an object of parameters, validate the input and
 * parse to be used as a BaseCacheEntry.
 *
 * @private
 * @memberof module:workbox-precaching
 * @extends {module:workbox-precaching.BaseCacheEntry}
 */
class ObjectCacheEntry extends BaseCacheEntry {
  /**
   * This class gives most control over configuring a cache entry.
   * @param {Object} input
   * @param {String} input.entryID The ID of the entry. This is the key used
   * with IndexDB to store the revision. Normally this is just the URL.
   * @param {String} input.revision This is the revision associated with this
   * URL.
   * @param {String} input.url The URL to cache.
   * @param {boolean} input.cacheBust A boolean to indicate if this request
   * will require cache busting (i.e. the URL is not unique between SW install).
   */
  constructor({entryID, revision, url, cacheBust}) {
    if (typeof cacheBust === 'undefined') {
      cacheBust = true;
    }
    if (typeof entryID === 'undefined') {
      entryID = new URL(url, location).toString();
    }

    isType({revision}, 'string');
    if (revision.length === 0) {
      throw new WorkboxError('invalid-object-entry',
        {problemParam: 'revision', problemValue: revision});
    }

    isType({url}, 'string');
    if (url.length === 0) {
      throw new WorkboxError('invalid-object-entry',
        {problemParam: 'url', problemValue: url});
    }

    isType({entryID}, 'string');
    if (entryID.length === 0) {
      throw new WorkboxError('invalid-object-entry',
        {problemParam: 'entryID', problemValue: entryID});
    }

    isType({cacheBust}, 'boolean');

    super({
      entryID,
      revision,
      request: new Request(url),
      cacheBust,
    });
  }
}

export default ObjectCacheEntry;
