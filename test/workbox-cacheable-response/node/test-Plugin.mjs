import {expect} from 'chai';
import sinon from 'sinon';

import {CacheableResponse} from '../../../packages/workbox-cacheable-response/CacheableResponse.mjs';
import {Plugin} from '../../../packages/workbox-cacheable-response/Plugin.mjs';

describe(`[workbox-cacheable-response] Plugin`, function() {
  const STATUSES = [200];

  const sandbox = sinon.createSandbox();

  beforeEach(function() {
    sandbox.restore();
  });

  after(function() {
    sandbox.restore();
  });

  describe(`constructor`, function() {
    it(`should construct a properly-configured internal CacheableResponse instance`, function() {
      const cacheableResponsePlugin = new Plugin({statuses: STATUSES});
      expect(cacheableResponsePlugin._cacheableResponse).to.be.instanceOf(CacheableResponse);
      expect(cacheableResponsePlugin._cacheableResponse._statuses).to.eql(STATUSES);
    });

    it(`should expose cacheWillUpdate, which calls cacheableResponse.isResponseCacheable()`, function() {
      const cacheableResponsePlugin = new Plugin({statuses: STATUSES});
      const isResponseCacheableSpy = sandbox.spy(cacheableResponsePlugin._cacheableResponse, 'isResponseCacheable');
      const response = new Response('');
      cacheableResponsePlugin.cacheWillUpdate({response});

      expect(isResponseCacheableSpy.calledOnce).to.be.true;
      expect(isResponseCacheableSpy.calledWithExactly(response)).to.be.true;
    });
  });

  describe(`cacheWillUpdate`, function() {
    it(`should return null for non-cachable response`, function() {
      const cacheableResponsePlugin = new Plugin({statuses: STATUSES});
      sandbox.stub(cacheableResponsePlugin._cacheableResponse, 'isResponseCacheable').callsFake(() => false);
      expect(cacheableResponsePlugin.cacheWillUpdate({
        response: new Response(),
      })).to.equal(null);
    });
  });
});
