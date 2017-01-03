import BaseCacheEntry from './base-precache-entry';
import ErrorFactory from '../../error-factory';

class RequestCacheEntry extends BaseCacheEntry {
  constructor(request) {
    if(typeof request === 'string') {
      request = new Request(request, {
        credentials: 'same-origin',
      });
    } else if (!(request instanceof Request)) {
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
