/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {CacheableResponse} from 'workbox-cacheable-response/CacheableResponse.mjs';
import {CacheableResponsePlugin} from 'workbox-cacheable-response/CacheableResponsePlugin.mjs';

describe(`CacheableResponsePlugin`, function () {
  const STATUSES = [200];

  const sandbox = sinon.createSandbox();

  beforeEach(function () {
    sandbox.restore();
  });

  after(function () {
    sandbox.restore();
  });

  describe(`constructor`, function () {
    it(`should construct a properly-configured internal CacheableResponse instance`, function () {
      const cacheableResponsePlugin = new CacheableResponsePlugin({
        statuses: STATUSES,
      });
      expect(cacheableResponsePlugin._cacheableResponse).to.be.instanceOf(
        CacheableResponse,
      );
      expect(cacheableResponsePlugin._cacheableResponse._statuses).to.eql(
        STATUSES,
      );
    });

    it(`should expose cacheWillUpdate, which calls cacheableResponse.isResponseCacheable()`, function () {
      const cacheableResponsePlugin = new CacheableResponsePlugin({
        statuses: STATUSES,
      });
      const isResponseCacheableSpy = sandbox.spy(
        cacheableResponsePlugin._cacheableResponse,
        'isResponseCacheable',
      );
      const response = new Response('');
      cacheableResponsePlugin.cacheWillUpdate({response});

      expect(isResponseCacheableSpy.calledOnce).to.be.true;
      expect(isResponseCacheableSpy.calledWithExactly(response)).to.be.true;
    });
  });

  describe(`cacheWillUpdate`, function () {
    it(`should return null for non-cachable response`, async function () {
      const cacheableResponsePlugin = new CacheableResponsePlugin({
        statuses: STATUSES,
      });
      sandbox
        .stub(cacheableResponsePlugin._cacheableResponse, 'isResponseCacheable')
        .callsFake(() => false);
      expect(
        await cacheableResponsePlugin.cacheWillUpdate({
          response: new Response(),
        }),
      ).to.equal(null);
    });
  });
});
