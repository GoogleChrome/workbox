import {expect} from 'chai';
import sinon from 'sinon';

import CacheTimestampsModel from '../../../packages/workbox-cache-expiration/models/CacheTimestampsModel.mjs';
import CacheExpirationManager from '../../../packages/workbox-cache-expiration/CacheExpirationManager.mjs';

describe(`[workbox-cache-expiration] CacheExpirationManager`, function() {
  let sandbox = sinon.sandbox.create();

  beforeEach(function() {
    sandbox.restore();
  });

  after(function() {
    sandbox.restore();
  });

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

    it(`should return only the expired entries`, async function() {
      const cacheName = 'test-cache';
      const maxAgeSeconds = 10;
      const currentTimestamp = Date.now();
      const timestampModel = new CacheTimestampsModel(cacheName);
      timestampModel.setTimestamp('/', currentTimestamp);

      const expirationManager = new CacheExpirationManager(cacheName, {maxAgeSeconds});

      let expiredUrls = await expirationManager._findOldEntries(currentTimestamp);
      expect(expiredUrls).to.deep.equal([]);

      // The plus one is to ensure it expires
      expiredUrls = await expirationManager._findOldEntries(currentTimestamp + maxAgeSeconds * 1000 + 1);
      expect(expiredUrls).to.deep.equal(['/']);
    });
  });

  describe(`expireEntries()`, function() {
    it(`should expire and delete expired entries`, async function() {
      const clock = sandbox.useFakeTimers({
        toFake: ['Date'],
      });

      const cacheName = 'test-cache';
      const maxAgeSeconds = 10;
      const currentTimestamp = Date.now();

      const timestampModel = new CacheTimestampsModel(cacheName);
      timestampModel.setTimestamp('/', currentTimestamp);

      const expirationManager = new CacheExpirationManager(cacheName, {maxAgeSeconds});

      let expiredUrls = await expirationManager.expireEntries();
      expect(expiredUrls).to.deep.equal([]);

      clock.tick(maxAgeSeconds * 1000 + 1);

      // The plus one is to ensure it expires
      expiredUrls = await expirationManager.expireEntries();
      expect(expiredUrls).to.deep.equal(['/']);

      // Check IDB is empty
      const timestamps = await timestampModel.getAllTimestamps();
      expect(timestamps).to.deep.equal({});

      // TODO Check cache is empty
    });
  });
});
