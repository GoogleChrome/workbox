/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {CacheTimestampsModel} from 'workbox-expiration/models/CacheTimestampsModel.mjs';
import {CacheExpiration} from 'workbox-expiration/CacheExpiration.mjs';
import {openDB} from 'idb';

describe(`CacheExpiration`, function () {
  const sandbox = sinon.createSandbox();
  let db = null;

  beforeEach(async function () {
    db = await openDB('workbox-expiration', 1, {
      upgrade: CacheTimestampsModel.prototype._upgradeDb,
    });
    await db.clear('cache-entries');

    const cacheKeys = await caches.keys();
    for (const cacheKey of cacheKeys) {
      await caches.delete(cacheKey);
    }

    sandbox.restore();
  });

  after(function () {
    sandbox.restore();
  });

  describe(`constructor`, function () {
    it(`should be able to construct with cacheName and maxEntries`, function () {
      const expirationManager = new CacheExpiration('test-cache', {
        maxEntries: 10,
      });
      expect(expirationManager._maxEntries).to.equal(10);
    });

    it(`should be able to construct with cacheName and maxAgeSeconds`, function () {
      const expirationManager = new CacheExpiration('test-cache', {
        maxAgeSeconds: 10,
      });
      expect(expirationManager._maxAgeSeconds).to.equal(10);
    });

    it(`should be able to construct with cacheName, maxEntries and maxAgeSeconds`, function () {
      const expirationManager = new CacheExpiration('test-cache', {
        maxEntries: 1,
        maxAgeSeconds: 2,
      });
      expect(expirationManager._maxEntries).to.equal(1);
      expect(expirationManager._maxAgeSeconds).to.equal(2);
    });

    it(`should be able to construct with cacheName, maxEntries and matchOptions`, function () {
      const expirationManager = new CacheExpiration('test-cache', {
        maxEntries: 1,
        matchOptions: {
          ignoreVary: true,
        },
      });

      expect(expirationManager._maxEntries).to.eql(1);
      expect(expirationManager._matchOptions).to.eql({ignoreVary: true});
    });

    it(`should throw with no config`, function () {
      if (process.env.NODE_ENV === 'production') this.skip();

      return expectError(() => {
        new CacheExpiration('my-cache');
      }, 'max-entries-or-age-required');
    });

    // TODO Bad constructor input
  });

  describe(`expireEntries()`, function () {
    it(`should expire and delete expired entries`, async function () {
      const clock = sandbox.useFakeTimers({
        toFake: ['Date'],
      });

      const cacheName = 'expire-and-delete';
      const cache = await caches.open(cacheName);
      const expirationManager = new CacheExpiration(cacheName, {
        maxAgeSeconds: 10,
      });

      const timestampModel = new CacheTimestampsModel(cacheName);
      await timestampModel.setTimestamp('/one', Date.now());
      await cache.put(
        `${location.origin}/one`,
        new Response('Injected request'),
      );

      clock.tick(5000);

      // Add another entry after 5 seconds.
      await timestampModel.setTimestamp('/two', Date.now());
      await cache.put(
        `${location.origin}/two`,
        new Response('Injected request'),
      );

      // Ensure both entries are still present after an initial expire.
      await expirationManager.expireEntries();

      let timestamps = await db.getAll('cache-entries');
      expect(timestamps).to.have.lengthOf(2);
      expect(timestamps[0].url).to.equal(`${location.origin}/one`);
      expect(timestamps[1].url).to.equal(`${location.origin}/two`);

      let cachedRequests = await cache.keys();
      expect(cachedRequests).to.have.lengthOf(2);
      expect(cachedRequests[0].url).to.equal(`${location.origin}/one`);
      expect(cachedRequests[1].url).to.equal(`${location.origin}/two`);

      // Tick the clock 6 seconds, so the first entry should now be expired.
      clock.tick(6000);
      await expirationManager.expireEntries();

      timestamps = await db.getAll('cache-entries');
      expect(timestamps).to.have.lengthOf(1);
      expect(timestamps[0].url).to.equal(`${location.origin}/two`);

      // Check cache is empty
      cachedRequests = await cache.keys();
      expect(cachedRequests).to.have.lengthOf(1);
      expect(cachedRequests[0].url).to.equal(`${location.origin}/two`);

      // Tick the clock 5 more seconds, so all entries should be expired.
      clock.tick(5000);
      await expirationManager.expireEntries();

      // Check IDB is empty
      timestamps = await db.getAll('cache-entries');
      expect(timestamps).to.deep.equal([]);

      // Check cache is empty
      cachedRequests = await cache.keys();
      expect(cachedRequests).to.deep.equal([]);
    });

    it(`should expire and delete entries beyond maximum entries`, async function () {
      const cacheName = 'max-and-delete';
      const maxEntries = 1;
      const currentTimestamp = Date.now();
      const cache = await caches.open(cacheName);

      const timestampModel = new CacheTimestampsModel(cacheName);
      await timestampModel.setTimestamp('/first', currentTimestamp);
      await cache.put(
        `${location.origin}/first`,
        new Response('Injected request'),
      );

      const expirationManager = new CacheExpiration(cacheName, {maxEntries});

      await expirationManager.expireEntries();

      // Add entry and ensure it is removed
      await timestampModel.setTimestamp('/second', currentTimestamp - 1000);
      await cache.put(
        `${location.origin}/second`,
        new Response('Injected request'),
      );

      await expirationManager.expireEntries();

      // Check that IDB has /first
      let timestamps = await db.getAll('cache-entries');

      expect(timestamps).to.have.lengthOf(1);
      expect(timestamps[0].url).to.equal(`${location.origin}/first`);
      expect(timestamps[0].timestamp).to.equal(currentTimestamp);

      // Check cache has /first
      let cachedRequests = await cache.keys();
      expect(cachedRequests.map((req) => req.url)).to.deep.equal([
        `${location.origin}/first`,
      ]);

      await timestampModel.setTimestamp('/third', currentTimestamp + 1000);
      await cache.put(
        `${location.origin}/third`,
        new Response('Injected request'),
      );

      await expirationManager.expireEntries();

      // Check that IDB has /third
      timestamps = await db.getAll('cache-entries');

      expect(timestamps).to.have.lengthOf(1);
      expect(timestamps[0].url).to.equal(`${location.origin}/third`);
      expect(timestamps[0].timestamp).to.equal(currentTimestamp + 1000);

      // Check cache has /third
      cachedRequests = await cache.keys();
      expect(cachedRequests.map((req) => req.url)).to.deep.equal([
        `${location.origin}/third`,
      ]);
    });

    it(`should pass matchOptions to the underlying cache.delete() call`, async function () {
      const cacheName = 'matchOptions-test';
      const maxEntries = 1;
      const currentTimestamp = Date.now();
      const timestampModel = new CacheTimestampsModel(cacheName);

      const cache = await caches.open(cacheName);
      const cacheDeleteSpy = sandbox.spy(cache, 'delete');
      sandbox.stub(self.caches, 'open').resolves(cache);

      await timestampModel.setTimestamp('/first', currentTimestamp);
      await cache.put(
        `${location.origin}/first`,
        new Response('Injected request'),
      );

      const expirationManager = new CacheExpiration(cacheName, {
        maxEntries,
        matchOptions: {
          ignoreVary: true,
        },
      });
      await expirationManager.expireEntries();

      // Add entry and ensure it is removed
      await timestampModel.setTimestamp('/second', currentTimestamp - 1000);
      await cache.put(
        `${location.origin}/second`,
        new Response('Injected request'),
      );

      await expirationManager.expireEntries();
      expect(cacheDeleteSpy.args).to.eql([
        [`${location.origin}/second`, {ignoreVary: true}],
      ]);
    });

    it(`should queue up expireEntries calls`, async function () {
      const expirationManager = new CacheExpiration('test', {maxEntries: 10});

      sandbox.spy(expirationManager, 'expireEntries');
      sandbox.spy(CacheTimestampsModel.prototype, 'expireEntries');

      const expireDone = expirationManager.expireEntries();
      expirationManager.expireEntries();
      expirationManager.expireEntries();

      expect(expirationManager.expireEntries.callCount).to.equal(3);
      expect(CacheTimestampsModel.prototype.expireEntries.callCount).to.equal(
        1,
      );

      await expireDone;

      expect(expirationManager.expireEntries.callCount).to.equal(4);
      expect(CacheTimestampsModel.prototype.expireEntries.callCount).to.equal(
        2,
      );
    });

    it(`should expire multiple expired entries`, async function () {
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
      await cache.put(`${location.origin}/1`, new Response('Injected request'));
      await cache.put(`${location.origin}/2`, new Response('Injected request'));

      const expirationManager = new CacheExpiration(cacheName, {maxAgeSeconds});

      await expirationManager.expireEntries();

      clock.tick(maxAgeSeconds * 1000 + 1);

      // The plus one is to ensure it expires
      await expirationManager.expireEntries();

      // Check that IDB is empty
      const timestamps = await db.getAll('cache-entries');
      expect(timestamps).to.deep.equal([]);

      // Check cache is empty
      const cachedRequests = await cache.keys();
      expect(cachedRequests).to.deep.equal([]);
    });
  });

  describe(`updateTimestamp()`, function () {
    it(`should update the timestamp for a url`, async function () {
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

      const timestamps = await db.getAll('cache-entries');

      expect(timestamps).to.have.lengthOf(1);
      expect(timestamps[0].url).to.equal(`${location.origin}/`);
      expect(timestamps[0].timestamp).to.equal(currentTimestamp + 1000);
    });
  });

  describe(`isURLExpired()`, function () {
    it(`should throw when called without maxAgeSeconds`, function () {
      if (process.env.NODE_ENV === 'production') this.skip();

      const expirationManager = new CacheExpiration('test-cache', {
        maxEntries: 1,
      });
      return expectError(() => {
        return expirationManager.isURLExpired();
      }, 'expired-test-without-max-age');
    });

    it(`should return boolean`, async function () {
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
