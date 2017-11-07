import {expect} from 'chai';
import sinon from 'sinon';
import {reset as iDBReset} from 'shelving-mock-indexeddb';

import expectError from '../../../infra/testing/expectError';

import CacheTimestampsModel from '../../../packages/workbox-cache-expiration/models/CacheTimestampsModel.mjs';
import {CacheExpiration} from '../../../packages/workbox-cache-expiration/CacheExpiration.mjs';

describe(`[workbox-cache-expiration] CacheExpiration`, function() {
  let sandbox = sinon.sandbox.create();

  beforeEach(function() {
    sandbox.restore();
    iDBReset();
  });

  after(function() {
    sandbox.restore();
    iDBReset();
  });

  describe(`constructor`, function() {
    it(`should be able to constructor with cache name and maxEntries`, function() {
      const expirationManager = new CacheExpiration('test-cache', {maxEntries: 10});
      expect(expirationManager._maxEntries).to.equal(10);
    });

    it(`should be able to constructor with cache name and maxAgeSeconds`, function() {
      const expirationManager = new CacheExpiration('test-cache', {maxAgeSeconds: 10});
      expect(expirationManager._maxAgeSeconds).to.equal(10);
    });

    it(`should be able to constructor with cache name and maxAgeSeconds`, function() {
      const expirationManager = new CacheExpiration('test-cache', {maxEntries: 1, maxAgeSeconds: 2});
      expect(expirationManager._maxEntries).to.equal(1);
      expect(expirationManager._maxAgeSeconds).to.equal(2);
    });

    // TODO Bad constructor input
  });

  describe('_findOldEntries()', function() {
    it(`should return no expired entries for empty indexedDB`, async function() {
      const expirationManager = new CacheExpiration('find-expired-entries-empty', {maxAgeSeconds: 10});
      const oldEntries = await expirationManager._findOldEntries(Date.now());
      expect(oldEntries).to.deep.equal([]);
    });

    it(`should return only the expired entries`, async function() {
      const cacheName = 'find-expired-entries';
      const maxAgeSeconds = 10;
      const currentTimestamp = Date.now();
      const timestampModel = new CacheTimestampsModel(cacheName);
      await timestampModel.setTimestamp('/', currentTimestamp);

      const expirationManager = new CacheExpiration(cacheName, {maxAgeSeconds});

      let expiredUrls = await expirationManager._findOldEntries(currentTimestamp);
      expect(expiredUrls).to.deep.equal([]);

      // The plus one is to ensure it expires
      expiredUrls = await expirationManager._findOldEntries(currentTimestamp + maxAgeSeconds * 1000 + 1);
      expect(expiredUrls).to.deep.equal(['https://example.com/']);
    });
  });

  describe('_findExtraEntries()', function() {
    it(`should return no extra entries for empty indexedDB`, async function() {
      const expirationManager = new CacheExpiration('find-extra-entries-empty', {maxAgeSeconds: 10});
      const extraEntries = await expirationManager._findExtraEntries();
      expect(extraEntries).to.deep.equal([]);
    });

    it(`should return only the extra entries`, async function() {
      const cacheName = 'find-extra-entries';
      const maxEntries = 1;
      const earliestTimestamp = Date.now();
      const secondEarlistTimestamp = earliestTimestamp + 1000;
      const latestTimestamp = earliestTimestamp + 2000;
      const timestampModel = new CacheTimestampsModel(cacheName);

      const expirationManager = new CacheExpiration(cacheName, {maxEntries});

      // No entries added, should be empty
      let extraUrls = await expirationManager._findExtraEntries();
      expect(extraUrls).to.deep.equal([]);

      await timestampModel.setTimestamp('/second-earliest', secondEarlistTimestamp);

      // Added one entry, max is one, return empty array
      extraUrls = await expirationManager._findExtraEntries();
      expect(extraUrls).to.deep.equal([]);

      await timestampModel.setTimestamp('/latest', latestTimestamp);

      // Added two entries, max is one, return one entry
      extraUrls = await expirationManager._findExtraEntries();
      expect(extraUrls).to.deep.equal(['https://example.com/second-earliest']);

      await timestampModel.setTimestamp('/earliest', earliestTimestamp);

      // Added three entries, max is one, return two entries
      extraUrls = await expirationManager._findExtraEntries();
      expect(extraUrls).to.deep.equal(['https://example.com/earliest', 'https://example.com/second-earliest']);
    });
  });

  describe(`expireEntries()`, function() {
    it(`should expire and delete expired entries`, async function() {
      const clock = sandbox.useFakeTimers({
        toFake: ['Date'],
      });

      const cacheName = 'expire-and-delete';
      const maxAgeSeconds = 10;
      const currentTimestamp = Date.now();
      const cache = await caches.open(cacheName);

      const timestampModel = new CacheTimestampsModel(cacheName);
      await timestampModel.setTimestamp('/', currentTimestamp);
      cache.put('https://example.com/', new Response('Injected request'));

      const expirationManager = new CacheExpiration(cacheName, {maxAgeSeconds});

      let expiredUrls = await expirationManager.expireEntries();
      expect(expiredUrls).to.deep.equal([]);

      clock.tick(maxAgeSeconds * 1000 + 1);

      // The plus one is to ensure it expires
      expiredUrls = await expirationManager.expireEntries();
      expect(expiredUrls).to.deep.equal(['https://example.com/']);

      // Check IDB is empty
      const timestamps = await timestampModel.getAllTimestamps();
      expect(timestamps).to.deep.equal([]);

      // Check cache is empty
      const cachedRequests = await cache.keys();
      expect(cachedRequests).to.deep.equal([]);
    });

    it(`should expire and delete entries beyond maximum entries`, async function() {
      const cacheName = 'max-and-delete';
      const maxEntries = 1;
      const currentTimestamp = Date.now();
      const cache = await caches.open(cacheName);

      const timestampModel = new CacheTimestampsModel(cacheName);
      await timestampModel.setTimestamp('/first', currentTimestamp);
      cache.put('https://example.com/first', new Response('Injected request'));

      const expirationManager = new CacheExpiration(cacheName, {maxEntries});

      let expiredUrls = await expirationManager.expireEntries();
      expect(expiredUrls).to.deep.equal([]);

      // Add entry and ensure it is removed
      await timestampModel.setTimestamp('/second', currentTimestamp - 1000);
      cache.put('https://example.com/second', new Response('Injected request'));

      expiredUrls = await expirationManager.expireEntries();
      expect(expiredUrls).to.deep.equal(['https://example.com/second']);

      // Check IDB is has /first
      let timestamps = await timestampModel.getAllTimestamps();
      expect(timestamps).to.deep.equal([{
        url: 'https://example.com/first',
        timestamp: currentTimestamp,
      }]);

      // Check cache has /first
      let cachedRequests = await cache.keys();
      expect(cachedRequests.map((req) => req.url)).to.deep.equal(['https://example.com/first']);

      await timestampModel.setTimestamp('/third', currentTimestamp + 1000);
      cache.put('https://example.com/third', new Response('Injected request'));

      expiredUrls = await expirationManager.expireEntries();
      expect(expiredUrls).to.deep.equal(['https://example.com/first']);

      // Check IDB is has /third
      timestamps = await timestampModel.getAllTimestamps();
      expect(timestamps).to.deep.equal([{
        url: 'https://example.com/third',
        timestamp: currentTimestamp + 1000,
      }]);

      // Check cache has /third
      cachedRequests = await cache.keys();
      expect(cachedRequests.map((req) => req.url)).to.deep.equal(['https://example.com/third']);
    });
  });

  describe(`updateTimestamp()`, function() {
    it(`should update the timestamp for a url`, async function() {
      const clock = sandbox.useFakeTimers({
        toFake: ['Date'],
      });

      const cacheName = 'update-timestamp';
      const maxAgeSeconds = 10;
      const currentTimestamp = Date.now();
      const timestampModel = new CacheTimestampsModel(cacheName);
      await timestampModel.setTimestamp('/', currentTimestamp);

      clock.tick(1000);

      const expirationManager = new CacheExpiration(cacheName, {maxAgeSeconds});
      await expirationManager.updateTimestamp('/');

      const timestamps = await timestampModel.getAllTimestamps();
      expect(timestamps).to.deep.equal([{
        url: 'https://example.com/',
        timestamp: currentTimestamp + 1000,
      }]);
    });
  });

  describe(`isURLExpired()`, function() {
    it(`should throw when called without maxAgeSeconds`, function() {
      const expirationManager = new CacheExpiration('test-cache', {maxEntries: 1});
      return expectError(() => {
        return expirationManager.isURLExpired();
      }, 'expired-test-without-max-age');
    });

    it(`should return boolean`, async function() {
      const clock = sandbox.useFakeTimers({
        toFake: ['Date'],
      });

      const cacheName = 'update-timestamp';
      const maxAgeSeconds = 10;
      const currentTimestamp = Date.now();
      const timestampModel = new CacheTimestampsModel(cacheName);
      await timestampModel.setTimestamp('/', currentTimestamp);

      const expirationManager = new CacheExpiration(cacheName, {maxAgeSeconds});
      let isExpired = await expirationManager.isURLExpired('/');
      expect(isExpired).to.equal(false);

      clock.tick(maxAgeSeconds * 1000 + 1);

      isExpired = await expirationManager.isURLExpired('/');
      expect(isExpired).to.equal(true);
    });
  });
});
