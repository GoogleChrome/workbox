import {expect} from 'chai';
import sinon from 'sinon';

import {CacheableResponse} from '../../../packages/workbox-cacheable-response/CacheableResponse.mjs';
import {Plugin} from '../../../packages/workbox-cacheable-response/Plugin.mjs';

describe(`[workbox-cacheable-response] Plugin`, function() {
  describe(`constructor`, function() {
    const STATUSES = [200];

    it(`should construct a properly-configured internal CacheableResponse instance`, function() {
      const cacheableResponsePlugin = new Plugin({statuses: STATUSES});
      expect(cacheableResponsePlugin._cacheableResponse).to.be.instanceOf(CacheableResponse);
      expect(cacheableResponsePlugin._cacheableResponse._statuses).to.eql(STATUSES);
    });

    it(`should expose cacheWillUpdate, which calls cacheableResponse.isResponseCacheable()`, function() {
      const cacheableResponsePlugin = new Plugin({statuses: STATUSES});
      const isResponseCacheableSpy = sinon.spy(cacheableResponsePlugin._cacheableResponse, 'isResponseCacheable');
      const response = new Response('');
      cacheableResponsePlugin.cacheWillUpdate({response});

      expect(isResponseCacheableSpy.calledOnce).to.be.true;
      expect(isResponseCacheableSpy.calledWithExactly(response)).to.be.true;
    });
  });
});
