/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {expect} from 'chai';
import sinon from 'sinon';
import {reset as iDBReset} from 'shelving-mock-indexeddb';

import expectError from '../../../infra/testing/expectError';
import {devOnly} from '../../../infra/testing/env-it';

import {DBWrapper} from '../../../packages/workbox-core/_private/DBWrapper.mjs';
import {CacheTimestampsModel} from '../../../packages/workbox-expiration/models/CacheTimestampsModel.mjs';
import {CacheExpiration} from '../../../packages/workbox-expiration/CacheExpiration.mjs';

describe(`[workbox-expiration] CacheExpiration`, function() {
  let sandbox = sinon.createSandbox();

  const getDb = async () => {
    // Throw in the upgradeneeded callback because in these tests we only
    // want to be getting a connection to the DB, not creating it.
    return new DBWrapper('workbox-expiration', 1, {
      onupgradeneeded: () => {
        throw new Error(`DB 'workbox-expiration' expected to already be open.`);
      },
    });
  };

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

    devOnly.it(`should throw with no config`, function() {
      return expectError(() => {
        new CacheExpiration('my-cache');
      }, 'max-entries-or-age-required');
    });

    // TODO Bad constructor input
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

      await expirationManager.expireEntries();

      clock.tick(maxAgeSeconds * 1000 + 1);

      // The plus one is to ensure it expires
      await expirationManager.expireEntries();

      // Check IDB is empty
      const db = await getDb();
      const timestamps = await db.getAll('cache-entries');
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

      await expirationManager.expireEntries();

      // Add entry and ensure it is removed
      await timestampModel.setTimestamp('/second', currentTimestamp - 1000);
      cache.put('https://example.com/second', new Response('Injected request'));

      await expirationManager.expireEntries();

      // Check that IDB has /first
      const db = await getDb();
      let timestamps = await db.getAll('cache-entries');

      expect(timestamps).to.have.lengthOf(1);
      expect(timestamps[0].url).to.equal('https://example.com/first');
      expect(timestamps[0].timestamp).to.equal(currentTimestamp);

      // Check cache has /first
      let cachedRequests = await cache.keys();
      expect(cachedRequests.map((req) => req.url)).to.deep.equal(['https://example.com/first']);

      await timestampModel.setTimestamp('/third', currentTimestamp + 1000);
      cache.put('https://example.com/third', new Response('Injected request'));

      await expirationManager.expireEntries();

      // Check that IDB has /third
      timestamps = await db.getAll('cache-entries');

      expect(timestamps).to.have.lengthOf(1);
      expect(timestamps[0].url).to.equal('https://example.com/third');
      expect(timestamps[0].timestamp).to.equal(currentTimestamp + 1000);

      // Check cache has /third
      cachedRequests = await cache.keys();
      expect(cachedRequests.map((req) => req.url)).to.deep.equal(['https://example.com/third']);
    });

    it(`should queue up expireEntries calls`, async function() {
      const expirationManager = new CacheExpiration('test', {maxEntries: 10});

      sandbox.spy(expirationManager, 'expireEntries');
      sandbox.spy(CacheTimestampsModel.prototype, 'expireEntries');

      const expireDone = expirationManager.expireEntries();
      expirationManager.expireEntries();
      expirationManager.expireEntries();

      expect(expirationManager.expireEntries.callCount).to.equal(3);
      expect(CacheTimestampsModel.prototype.expireEntries.callCount).to.equal(1);

      await expireDone;

      expect(expirationManager.expireEntries.callCount).to.equal(4);
      expect(CacheTimestampsModel.prototype.expireEntries.callCount).to.equal(2);
    });

    it(`should expire multiple expired entries`, async function() {
      const clock = sandbox.useFakeTimers({
        toFake: ['Date'],
      });

      const cacheName = 'expire-and-delete';
      const maxAgeSeconds = 10;
      const currentTimestamp = Date.now();
      const cache = await caches.open(cacheName);

      const timestampModel = new CacheTimestampsModel(cacheName);
      await timestampModel.setTimestamp('/1', currentTimestamp);
      await timestampModel.setTimestamp('/2', currentTimestamp);
      cache.put('https://example.com/1', new Response('Injected request'));
      cache.put('https://example.com/2', new Response('Injected request'));

      const expirationManager = new CacheExpiration(cacheName, {maxAgeSeconds});

      await expirationManager.expireEntries();

      clock.tick(maxAgeSeconds * 1000 + 1);

      // The plus one is to ensure it expires
      await expirationManager.expireEntries();

      // Check that IDB is empty
      const db = await getDb();
      const timestamps = await db.getAll('cache-entries');
      expect(timestamps).to.deep.equal([]);

      // Check cache is empty
      const cachedRequests = await cache.keys();
      expect(cachedRequests).to.deep.equal([]);
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

      const db = await getDb();
      const timestamps = await db.getAll('cache-entries');

      expect(timestamps).to.have.lengthOf(1);
      expect(timestamps[0].url).to.equal('https://example.com/');
      expect(timestamps[0].timestamp).to.equal(currentTimestamp + 1000);
    });
  });

  describe(`isURLExpired()`, function() {
    devOnly.it(`should throw when called without maxAgeSeconds`, function() {
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
