import ErrorFactory from '../../error-factory';
import BaseCacheEntry from './base-precache-entry';
import assert from '../../../../../../lib/assert';

class DefaultsCacheEntry extends BaseCacheEntry {
  constructor({entryID, revision, url, cacheBust}) {
    if (typeof cacheBust === 'undefined') {
      cacheBust = true;
    }
    if (typeof entryID === 'undefined') {
      entryID = new URL(url, location).toString();
    }

    assert.isType({revision}, 'string');
    if (revision.length === 0) {
      throw ErrorFactory.createError('invalid-revisioned-entry',
        new Error('Bad revision Parameter. It should be a string with at ' +
          'least one character: ' + JSON.stringify(revision)));
    }

    assert.isType({url}, 'string');
    if (url.length === 0) {
      throw ErrorFactory.createError('invalid-revisioned-entry',
        new Error('Bad url Parameter. It should be a string:' +
          JSON.stringify(url)));
    }

    assert.isType({entryID}, 'string');
    if (entryID.length === 0) {
      throw ErrorFactory.createError('invalid-revisioned-entry',
        new Error('Bad entryID Parameter. It should be a string with at ' +
          'least one character: ' + JSON.stringify(entryID)));
    }

    assert.isType({cacheBust}, 'boolean');

    super({
      entryID,
      revision,
      request: new Request(url),
      cacheBust,
    });
  }
}

export default DefaultsCacheEntry;
