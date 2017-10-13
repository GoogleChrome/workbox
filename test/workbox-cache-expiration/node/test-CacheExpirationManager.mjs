import {expect} from 'chai';

import CacheExpirationManager from '../../../packages/workbox-cache-expiration/CacheExpirationManager.mjs';

describe(`[workbox-cache-expiration] CacheExpirationManager`, function() {
  describe(`constructor`, function() {
    it(`should be able to constructor with cache name and maxEntries`, function() {
      const expirationManager = new CacheExpirationManager('test-cache', {maxEntries: 10});
      expect(expirationManager._maxEntries).to.equal(10);
    });

    it(`should be able to constructor with cache name and maxAgeSeconds`, function() {
      const expirationManager = new CacheExpirationManager('test-cache', {maxAgeSeconds: 10});
      expect(expirationManager._maxAgeSeconds).to.equal(10);
    });

    it(`should be able to constructor with cache name and maxAgeSeconds`, function() {
      const expirationManager = new CacheExpirationManager('test-cache', {maxEntries: 1, maxAgeSeconds: 2});
      expect(expirationManager._maxEntries).to.equal(1);
      expect(expirationManager._maxAgeSeconds).to.equal(2);
    });

    // TODO Bad constructor input
  });

  describe('_findOldEntries()', function() {
    it(`should return no expired entries for empty indexedDB`, async function() {
      const expirationManager = new CacheExpirationManager('test-cache', {maxAgeSeconds: 10});
      const oldEntries = await expirationManager._findOldEntries(Date.now());
      expect(oldEntries).to.deep.equal([]);
    });
  });
});
