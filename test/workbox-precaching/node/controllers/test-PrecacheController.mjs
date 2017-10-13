import {expect} from 'chai';
import sinon from 'sinon';
import {reset as iDBReset} from 'shelving-mock-indexeddb';

import expectError from '../../../../infra/testing/expectError';
import generateTestVariants from '../../../../infra/testing/generate-variant-tests';
import {prodOnly, devOnly} from '../../../../infra/testing/env-it';

import {_private} from '../../../../packages/workbox-core/index.mjs';
import PrecacheController from '../../../../packages/workbox-precaching/controllers/PrecacheController.mjs';

const {cacheNames} = _private;

describe(`[workbox-precaching] PrecacheController`, function() {
  const sandbox = sinon.sandbox.create();

  beforeEach(async function() {
    let usedCacheNames = await caches.keys();
    await Promise.all(usedCacheNames.map((cacheName) => {
      return caches.delete(cacheName);
    }));

    iDBReset();

    // Run this in the `beforeEach` hook as well as the afterEach hook due to
    // a mocha bug where `afterEach` hooks aren't run for skipped tests.
    // https://github.com/mochajs/mocha/issues/2546
    sandbox.restore();

    sandbox.stub(console, 'log');
    sandbox.stub(console, 'debug');
    sandbox.stub(console, 'warn');
    sandbox.stub(console, 'groupCollapsed');
    sandbox.stub(console, 'groupEnd');
  });

  after(function() {
    sandbox.restore();
  });

  describe(`constructor`, function() {
    it(`should construct without any inputs`, async function() {
      expect(() => {
        new PrecacheController();
      }).to.not.throw();
    });

    it(`should construct with a valid cache name`, async function() {
      expect(() => {
        new PrecacheController(`test-cache-name`);
      }).to.not.throw();
    });

    // TODO Add tests on bad cachename input
  });

  describe(`addToCacheList()`, function() {
    const badTopLevelInputs = [
      {},
      true,
      false,
      123,
      '',
      null,
      undefined,
    ];
    generateTestVariants(`should throw when passing in non-array values in dev`, badTopLevelInputs, async function(variant) {
      if (process.env.NODE_ENV == 'production') return this.skip();

      const precacheController = new PrecacheController();
      return expectError(() => {
        precacheController.addToCacheList(variant);
      }, 'not-an-array');
    });

    const badNestedInputs = [
      true,
      false,
      123,
      null,
      undefined,
      [],
      '',
      {},
    ];
    generateTestVariants(`should throw when passing in invalid inputs in the array in dev`, badNestedInputs, async function(variant) {
      if (process.env.NODE_ENV == 'production') return this.skip();

      const precacheController = new PrecacheController();
      return expectError(() => {
        precacheController.addToCacheList([variant]);
      }, 'add-to-cache-list-unexpected-type', (err) => {
        expect(err.details.entry).to.deep.equal(variant);
      });
    });

    const unrevisionedEntryGroups = {
      'string entries': [
        '/',
        '/hello.html',
        '/styles/hello.css',
        '/scripts/controllers/hello.js',
      ],
      'url only object entries': [
        {url: '/'},
        {url: '/hello.html'},
        {url: '/styles/hello.css'},
        {url: '/scripts/controllers/hello.js'},
      ],
    };

    Object.keys(unrevisionedEntryGroups).map((groupName) => {
      const inputGroup = unrevisionedEntryGroups[groupName];

      devOnly.it(`should add ${groupName} to cache list in dev`, async function() {
        const precacheController = new PrecacheController();

        precacheController.addToCacheList(inputGroup);

        expect(precacheController._entriesToCacheMap.size).to.equal(inputGroup.length);

        inputGroup.forEach((inputValue) => {
          const urlValue = inputValue.url || inputValue;

          const entry = precacheController._entriesToCacheMap.get(urlValue);
          expect(entry._entryId).to.equal(urlValue);
          expect(entry._revision).to.equal(urlValue);
        });
      });

      it(`should remove duplicate ${groupName}`, async function() {
        const precacheController = new PrecacheController();

        const inputUrls = [
          ...inputGroup,
          ...inputGroup,
        ];

        precacheController.addToCacheList(inputUrls);

        expect(precacheController._entriesToCacheMap.size).to.equal(inputGroup.length);

        inputGroup.forEach((inputValue) => {
          const urlValue = inputValue.url || inputValue;

          const entry = precacheController._entriesToCacheMap.get(urlValue);
          expect(entry._entryId).to.equal(urlValue);
          expect(entry._revision).to.equal(urlValue);
        });
      });
    });

    it(`should add url + revision objects to cache list`, async function() {
      const precacheController = new PrecacheController();

      const inputObjects = [
        {url: '/', revision: '123'},
        {url: '/hello.html', revision: '123'},
        {url: '/styles/hello.css', revision: '123'},
        {url: '/scripts/controllers/hello.js', revision: '123'},
      ];
      precacheController.addToCacheList(inputObjects);

      expect(precacheController._entriesToCacheMap.size).to.equal(inputObjects.length);

      inputObjects.forEach((inputObject) => {
        const entry = precacheController._entriesToCacheMap.get(inputObject.url);
        expect(entry._entryId).to.equal(inputObject.url);
        expect(entry._revision).to.equal(inputObject.revision);
      });
    });

    it(`should remove duplicate url + revision object entries`, async function() {
      const precacheController = new PrecacheController();

      const singleObject = {url: '/duplicate.html', revision: '123'};
      const inputObjects = [
        singleObject,
        singleObject,
      ];
      precacheController.addToCacheList(inputObjects);

      expect(precacheController._entriesToCacheMap.size).to.equal(1);

      const entry = precacheController._entriesToCacheMap.get(singleObject.url);
      expect(entry._entryId).to.equal(singleObject.url);
      expect(entry._revision).to.equal(singleObject.revision);
    });

    it(`should throw on conflicting entries with different revisions`, async function() {
      const firstEntry = {url: '/duplicate.html', revision: '123'};
      const secondEntry = {url: '/duplicate.html', revision: '456'};
      return expectError(() => {
        const precacheController = new PrecacheController();
        const inputObjects = [
          firstEntry,
          secondEntry,
        ];
        precacheController.addToCacheList(inputObjects);
      }, 'add-to-cache-list-conflicting-entries', (err) => {
        expect(err.details.firstEntry).to.deep.equal(firstEntry);
        expect(err.details.secondEntry).to.deep.equal(secondEntry);
      });
    });
  });

  describe('install()', function() {
    it('should be fine when calling with empty precache list', async function() {
      const precacheController = new PrecacheController();
      return precacheController.install();
    });

    it('should precache assets (with cache busting via search params)', async function() {
      const precacheController = new PrecacheController();
      const cacheList = [
        '/index.1234.html',
        {url: '/example.1234.css'},
        {url: '/scripts/index.js', revision: '1234'},
        {url: '/scripts/stress.js?test=search&foo=bar', revision: '1234'},
      ];
      precacheController.addToCacheList(cacheList);

      // Reset as addToCacheList will log.
      console.log.reset();

      const updateInfo = await precacheController.install();
      expect(updateInfo.updatedEntries.length).to.equal(cacheList.length);
      expect(updateInfo.notUpdatedEntries.length).to.equal(0);


      const cache = await caches.open(cacheNames.getPrecacheName());
      const keys = await cache.keys();
      expect(keys.length).to.equal(cacheList.length);

      const urls = cacheList.map((entry) => entry.url || entry);
      await Promise.all(urls.map(async (url) => {
        const cachedResponse = await cache.match(url);
        expect(cachedResponse).to.exist;
      }));

      if (process.env.NODE_ENV != 'production') {
        // Make sure we print some debug info.
        expect(console.log.callCount).to.be.gt(0);
      }
    });

    prodOnly.it('should not log install details in production', async function() {
      const precacheController = new PrecacheController();
      precacheController.addToCacheList([
        '/index.1234.html',
        {url: '/example.1234.css'},
        {url: '/scripts/index.js', revision: '1234'},
      ]);

      await precacheController.install();

      expect(console.log.callCount).to.equal(0);
    });

    it(`should clean redirected precache entries`, async function() {
      const fetchStub = sandbox.stub(global, 'fetch');
      fetchStub.callsFake(() => {
        const response = new Response('Redirected Response');
        response.redirected = true;
        return response;
      });

      const precacheController = new PrecacheController();
      precacheController.addToCacheList([
        '/index.1234.html',
        {url: '/example.1234.css'},
        {url: '/scripts/index.js', revision: '1234'},
      ]);

      await precacheController.install();
    });

    it(`should use the desired cache name`, async function() {
      const precacheController = new PrecacheController(`test-cache-name`);

      const cacheList = [
        {url: '/scripts/index.js', revision: '1234'},
        {url: '/index.html', revision: '1234'},
      ];

      precacheController.addToCacheList(cacheList);
      await precacheController.install();

      const cache = await caches.open(`test-cache-name`);
      const keys = await cache.keys();
      expect(keys.length).to.equal(cacheList.length);

      for (let i = 0; i < cacheList.length; i++) {
        let cachedResponse = await cache.match(cacheList[i].url);
        expect(cachedResponse).to.exist;
      }
    });

    it('should only precache assets that have changed', async function() {
      const cache = await caches.open(cacheNames.getPrecacheName());

      /*
      First precache some entries
      */
      const precacheControllerOne = new PrecacheController();
      const cacheListOne = [
        '/index.1234.html',
        {url: '/example.1234.css'},
        {url: '/scripts/index.js', revision: '1234'},
        {url: '/scripts/stress.js?test=search&foo=bar', revision: '1234'},
      ];
      precacheControllerOne.addToCacheList(cacheListOne);

      // Reset as addToCacheList will log.
      console.log.reset();

      const updateInfo = await precacheControllerOne.install();
      expect(updateInfo.updatedEntries.length).to.equal(cacheListOne.length);
      expect(updateInfo.notUpdatedEntries.length).to.equal(0);

      const keysOne = await cache.keys();
      expect(keysOne.length).to.equal(cacheListOne.length);

      const urlsOne = cacheListOne.map((entry) => entry.url || entry);
      await Promise.all(urlsOne.map(async (url) => {
        const cachedResponse = await cache.match(url);
        expect(cachedResponse).to.exist;
      }));

      if (process.env.NODE_ENV != 'production') {
        // Make sure we print some debug info.
        expect(console.log.callCount).to.be.gt(0);
      }

      /*
      THEN precache the same URLs but two with different revisions
      */
      const precacheControllerTwo = new PrecacheController();
      const cacheListTwo = [
        '/index.4321.html',
        {url: '/example.1234.css'},
        {url: '/scripts/index.js', revision: '1234'},
        {url: '/scripts/stress.js?test=search&foo=bar', revision: '4321'},
      ];
      precacheControllerTwo.addToCacheList(cacheListTwo);

      // Reset as addToCacheList will log.
      console.log.reset();

      const updateInfoTwo = await precacheControllerTwo.install();
      expect(updateInfoTwo.updatedEntries.length).to.equal(2);
      expect(updateInfoTwo.notUpdatedEntries.length).to.equal(2);

      const keysTwo = await cache.keys();
      // Precaching can't determine that 'index.1234.html' and 'index.4321.html'
      // represent the same URL, so the cache ould contain both at this point
      // since they are technically different URLs
      // It would be in the activate event that 'index.1234.html' would
      // be removed from the cache and indexedDB.
      expect(keysTwo.length).to.equal(cacheListTwo.length + 1);

      const urlsTwo = cacheListTwo.map((entry) => entry.url || entry);
      await Promise.all(urlsTwo.map(async (url) => {
        const cachedResponse = await cache.match(url);
        expect(cachedResponse).to.exist;
      }));

      if (process.env.NODE_ENV != 'production') {
        // Make sure we print some debug info.
        expect(console.log.callCount).to.be.gt(0);
      }
    });
  });

  describe(`cleanup()`, function() {
    // TODO: This requires service worker mocks to be fixed.
    // https://github.com/pinterest/service-workers/issues/40
    // https://github.com/pinterest/service-workers/issues/38
    it.skip(`should remove out of date entries`, async function() {
      const cache = await caches.open(cacheNames.getPrecacheName());

      /*
      First precache some entries
      */
      const precacheControllerOne = new PrecacheController();
      const cacheListOne = [
        '/index.1234.html',
        {url: '/example.1234.css'},
        {url: '/scripts/index.js', revision: '1234'},
        {url: '/scripts/stress.js?test=search&foo=bar', revision: '1234'},
      ];
      precacheControllerOne.addToCacheList(cacheListOne);
      await precacheControllerOne.install();

      // Reset as addToCacheList and install will log.
      console.log.reset();

      const cleanupDetailsOne = await precacheControllerOne.cleanup();
      expect(cleanupDetailsOne.deletedCacheRequests.length).to.equal(0);
      expect(cleanupDetailsOne.deletedRevisionDetails.length).to.equal(0);

      // Make sure we print some debug info.
      expect(console.log.callCount).to.equal(0);

      /*
      THEN precache the same URLs but two with different revisions
      */
      const precacheControllerTwo = new PrecacheController();
      const cacheListTwo = [
        '/index.4321.html',
        {url: '/example.1234.css'},
        {url: '/scripts/index.js', revision: '1234'},
        {url: '/scripts/stress.js?test=search&foo=bar', revision: '4321'},
      ];
      precacheControllerTwo.addToCacheList(cacheListTwo);
      await precacheControllerTwo.install();

      // Reset as addToCacheList and install will log.
      console.log.reset();

      const cleanupDetailsTwo = await precacheControllerTwo.cleanup();
      expect(cleanupDetailsTwo.deletedCacheRequests.length).to.equal(1);
      expect(cleanupDetailsTwo.deletedCacheRequests[0]).to.equal('/index.1234.html');
      expect(cleanupDetailsTwo.deletedRevisionDetails.length).to.equal(1);
      expect(cleanupDetailsTwo.deletedCacheRequests[0]).to.equal('/index.1234.html');

      const keysTwo = await cache.keys();
      // Precaching can't determine that 'index.1234.html' and 'index.4321.html'
      // represent the same URL, so the cache ould contain both at this point
      // since they are technically different URLs
      // It would be in the activate event that 'index.1234.html' would
      // be removed from the cache and indexedDB.
      expect(keysTwo.length).to.equal(cacheListTwo.length);

      const urlsTwo = cacheListTwo.map((entry) => entry.url || entry);
      await Promise.all(urlsTwo.map(async (url) => {
        const cachedResponse = await cache.match(url);
        expect(cachedResponse).to.exist;
      }));

      // Make sure we print some debug info.
      expect(console.log.callCount).to.be.gt(0);
    });

    it(`shouldn't open / create a cache when performing cleanup`, async function() {
      const precacheController = new PrecacheController();
      await precacheController.cleanup();

      const hasCache = await caches.has(cacheNames.getPrecacheName());
      expect(hasCache).to.equal(false);
    });

    prodOnly.it(`shouldn't log anything in production`, async function() {
      const precacheControllerOne = new PrecacheController();
      const cacheListOne = [
        '/index.1234.html',
        {url: '/example.1234.css'},
        {url: '/scripts/index.js', revision: '1234'},
        {url: '/scripts/stress.js?test=search&foo=bar', revision: '1234'},
      ];
      precacheControllerOne.addToCacheList(cacheListOne);
      await precacheControllerOne.install();
      await precacheControllerOne.cleanup();

      const precacheControllerTwo = new PrecacheController();
      const cacheListTwo = [
        '/index.4321.html',
        {url: '/example.1234.css'},
        {url: '/scripts/index.js', revision: '1234'},
        {url: '/scripts/stress.js?test=search&foo=bar', revision: '4321'},
      ];
      precacheControllerTwo.addToCacheList(cacheListTwo);
      await precacheControllerTwo.install();

      // Reset as addToCacheList and install will log.
      console.log.reset();

      await precacheControllerTwo.cleanup();

      // Make sure we didn't print any debug info.
      expect(console.log.callCount).to.equal(0);
    });
  });
});
