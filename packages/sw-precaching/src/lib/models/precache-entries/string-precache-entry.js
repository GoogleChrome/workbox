import ErrorFactory from '../../error-factory';
import BaseCacheEntry from './base-precache-entry';
import assert from '../../../../../../lib/assert';

class StringCacheEntry extends BaseCacheEntry {
  constructor(input) {
    assert.isType({input}, 'string');
    if (input.length === 0) {
      throw ErrorFactory.createError('invalid-revisioned-entry',
        new Error('Bad url Parameter. It should be a string:' +
          JSON.stringify(input)));
    }

    super({
      entryID: input,
      revision: input,
      request: new Request(input),
      cacheBust: false,
    });
  }
}

export default StringCacheEntry;
