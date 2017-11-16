import {expect} from 'chai';
import sinon from 'sinon';

import {CacheableResponse} from '../../../packages/workbox-cacheable-response/CacheableResponse.mjs';
import {CacheableResponsePlugin} from '../../../packages/workbox-cacheable-response/CacheableResponsePlugin.mjs';

describe(`[workbox-cacheable-response] CacheableResponsePlugin`, function() {
  describe(`constructor`, function() {
    it(`should store a CacheableResponse instance`, function() {
      const cacheableResponse = new CacheableResponse({statuses: [200]});
      const cacheableResponsePlugin = new CacheableResponsePlugin(cacheableResponse);
      expect(cacheableResponsePlugin._cacheableResponse).to.equal(cacheableResponse);
    });

    it(`should expose cacheWillUpdate, which calls cacheableResponse.isResponseCacheable()`, function() {
      const cacheableResponse = new CacheableResponse({statuses: [200]});
      const isResponseCacheableSpy = sinon.spy(cacheableResponse, 'isResponseCacheable');

      const cacheableResponsePlugin = new CacheableResponsePlugin(cacheableResponse);
      const response = new Response('');
      cacheableResponsePlugin.cacheWillUpdate({response});

      expect(isResponseCacheableSpy.calledOnce).to.be.true;
      expect(isResponseCacheableSpy.calledWithExactly(response)).to.be.true;
    });
  });
});
