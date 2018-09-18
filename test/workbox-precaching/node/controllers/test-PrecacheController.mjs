import {expect} from 'chai';
import sinon from 'sinon';
import {reset as iDBReset} from 'shelving-mock-indexeddb';

import expectError from '../../../../infra/testing/expectError';
import generateTestVariants from '../../../../infra/testing/generate-variant-tests';
import {prodOnly, devOnly} from '../../../../infra/testing/env-it';

import {_private} from '../../../../packages/workbox-core/index.mjs';
import {logger} from '../../../../packages/workbox-core/_private/logger.mjs';
import PrecacheController from '../../../../packages/workbox-precaching/controllers/PrecacheController.mjs';
import {fetchWrapper} from '../../../../packages/workbox-core/_private/fetchWrapper.mjs';
import {cacheWrapper} from '../../../../packages/workbox-core/_private/cacheWrapper.mjs';

const {cacheNames} = _private;

describe(`[workbox-precaching] PrecacheController`, function() {
  const sandbox = sinon.createSandbox();

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

    devOnly.it('should not print warnings if suppressWarnings is passed in', async function() {
      const precacheController = new PrecacheController();
      precacheController.addToCacheList(['/']);

      await precacheController.install({
        suppressWarnings: true,
      });
      expect(logger.warn.callCount).to.equal(0);

      await precacheController.install({
        suppressWarnings: false,
      });
      expect(logger.warn.callCount).to.be.gt(0);
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
      logger.log.resetHistory();

      const updateInfo = await precacheController.install();
      expect(updateInfo.updatedEntries.length).to.equal(cacheList.length);
      expect(updateInfo.notUpdatedEntries.length).to.equal(0);

      const cache = await caches.open(`${cacheNames.getPrecacheName()}-temp`);
      const keys = await cache.keys();
      expect(keys.length).to.equal(cacheList.length);

      const urls = cacheList.map((entry) => entry.url || entry);
      await Promise.all(urls.map(async (url) => {
        const cachedResponse = await cache.match(url);
        expect(cachedResponse).to.exist;
      }));

      if (process.env.NODE_ENV != 'production') {
        // Make sure we print some debug info.
        expect(logger.log.callCount).to.be.gt(0);
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

      expect(logger.log.callCount).to.equal(0);
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

      const cache = await caches.open(`test-cache-name-temp`);
      const keys = await cache.keys();
      expect(keys.length).to.equal(cacheList.length);

      for (let i = 0; i < cacheList.length; i++) {
        let cachedResponse = await cache.match(cacheList[i].url);
        expect(cachedResponse).to.exist;
      }
    });

    it('should only precache assets that have changed', async function() {
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
      const urlsListOne = cacheListOne.map((entry) => entry.url || entry);

      precacheControllerOne.addToCacheList(cacheListOne);

      // Reset as addToCacheList will log.
      logger.log.resetHistory();

      const updateInfo = await precacheControllerOne.install();
      expect(updateInfo.updatedEntries.length).to.equal(cacheListOne.length);
      expect(updateInfo.notUpdatedEntries.length).to.equal(0);

      if (process.env.NODE_ENV != 'production') {
        // Make sure we print some debug info.
        expect(logger.log.callCount).to.be.gt(0);
      }

      const tempCacheName = `${cacheNames.getPrecacheName()}-temp`;
      let tempCache = await caches.open(tempCacheName);
      let finalCache = await caches.open(cacheNames.getPrecacheName());

      // Make sure the files are cached in the temp cache and no the final cache
      const tempKeysOne = await tempCache.keys();
      const finalCacheKeysOne = await finalCache.keys();
      expect(tempKeysOne.length).to.equal(cacheListOne.length);
      expect(finalCacheKeysOne.length).to.equal(0);

      await Promise.all(urlsListOne.map(async (url) => {
        const cachedResponse = await tempCache.match(url);
        expect(cachedResponse).to.exist;
      }));

      await precacheControllerOne.activate();

      // Ensure temp cache is empty
       tempCache = await caches.open(tempCache);
      let requests = await tempCache.keys();
      expect(requests.length).to.equal(0);

      // The cache mock needs the cache to be re-opened to have up-to-date keys.
      finalCache = await caches.open(cacheNames.getPrecacheName());
      const finalCacheKeysOneActivate = await finalCache.keys();
      expect(finalCacheKeysOneActivate.length).to.equal(cacheListOne.length);

      // Make sure the files are cached in the final cache
      await Promise.all(urlsListOne.map(async (url) => {
        const cachedResponse = await finalCache.match(url);
        expect(cachedResponse).to.exist;
      }));

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
      const urlsListTwo = cacheListTwo.map((entry) => entry.url || entry);

      precacheControllerTwo.addToCacheList(cacheListTwo);

      // Reset as addToCacheList will log.
      logger.log.resetHistory();

      const updateInfoTwo = await precacheControllerTwo.install();
      expect(updateInfoTwo.updatedEntries.length).to.equal(2);
      expect(updateInfoTwo.notUpdatedEntries.length).to.equal(2);

      // The cache mock needs the cache to be re-opened to have up-to-date keys.
      tempCache = await caches.open(`${cacheNames.getPrecacheName()}-temp`);
      finalCache = await caches.open(cacheNames.getPrecacheName());

      const tempKeysTwo = await tempCache.keys();
      const finalKeysTwo = await finalCache.keys();

      // Temp cache will contain the two new URLs that need to be cached.
      // The final cache should be untouched until the activate step.
      // It would be in the activate event that 'index.1234.html' would
      // be removed from the cache and indexedDB.
      expect(tempKeysTwo.length).to.equal(updateInfoTwo.updatedEntries.length);
      expect(finalKeysTwo.length).to.equal(cacheListOne.length);
      await Promise.all(updateInfoTwo.updatedEntries.map(async (precacheEntry) => {
        const cachedResponse = await tempCache.match(precacheEntry._cacheRequest);
        expect(cachedResponse).to.exist;
      }));
      await Promise.all(urlsListOne.map(async (url) => {
        const cachedResponse = await finalCache.match(url);
        expect(cachedResponse).to.exist;
      }));

      if (process.env.NODE_ENV != 'production') {
        // Make sure we print some debug info.
        expect(logger.log.callCount).to.be.gt(0);
      }

      await precacheControllerTwo.activate();

      // Ensure temp cache is empty
      tempCache = await caches.open(tempCache);
      requests = await tempCache.keys();
      expect(requests.length).to.equal(0);

      // Cache mock needs this to update keys
      finalCache = await caches.open(cacheNames.getPrecacheName());
      const finalKeysTwoActivate = await finalCache.keys();
      expect(finalKeysTwoActivate.length).to.equal(urlsListTwo.length);
      await Promise.all(urlsListTwo.map(async (url) => {
        const cachedResponse = await finalCache.match(url);
        expect(cachedResponse).to.exist;
      }));
    });

    it('it should precache with plugins', async function() {
      sandbox.spy(fetchWrapper, 'fetch');
      sandbox.spy(cacheWrapper, 'put');

      const precacheController = new PrecacheController();
      const cacheList = [
        '/index.1234.html',
        {url: '/example.1234.css'},
        {url: '/scripts/index.js', revision: '1234'},
        {url: '/scripts/stress.js?test=search&foo=bar', revision: '1234'},
      ];
      precacheController.addToCacheList(cacheList);

      const testPlugins = [{
        name: 'plugin1',
      }, {
        name: 'plugin2',
      }];
      await precacheController.install({
        plugins: testPlugins,
      });

      expect(fetchWrapper.fetch.args[0][0].plugins).to.equal(testPlugins);
      expect(cacheWrapper.put.args[0][0].plugins).to.equal(testPlugins);

      await precacheController.activate({
        plugins: testPlugins,
      });

      expect(cacheWrapper.put.args[1][0].plugins).to.equal(testPlugins);
    });

    it(`it should set credentials: 'same-origin' on the precaching requests`, async function() {
      sandbox.spy(fetchWrapper, 'fetch');

      const precacheController = new PrecacheController();
      const cacheList = [
        '/index.1234.html',
      ];
      precacheController.addToCacheList(cacheList);

      await precacheController.install();

      const {request} = fetchWrapper.fetch.args[0][0];
      expect(request.credentials).to.eql('same-origin');
    });
  });

  describe(`activate()`, function() {
    it(`should remove out of date entry`, async function() {
      const cache = await caches.open(cacheNames.getPrecacheName());

      /*
      First precache some entries
      */
      const precacheControllerOne = new PrecacheController();
      const cacheListOne = [
        {url: '/scripts/index.js', revision: '1234'},
      ];
      precacheControllerOne.addToCacheList(cacheListOne);
      await precacheControllerOne.install();

      const cleanupDetailsOne = await precacheControllerOne.activate();
      expect(cleanupDetailsOne.deletedCacheRequests.length).to.equal(0);
      expect(cleanupDetailsOne.deletedRevisionDetails.length).to.equal(0);

      const precacheControllerTwo = new PrecacheController();
      const cacheListTwo = [];
      precacheControllerTwo.addToCacheList(cacheListTwo);
      await precacheControllerTwo.install();

      const cleanupDetailsTwo = await precacheControllerTwo.activate();
      expect(cleanupDetailsTwo.deletedCacheRequests.length).to.equal(1);
      expect(cleanupDetailsTwo.deletedCacheRequests[0]).to.equal('/scripts/index.js');
      expect(cleanupDetailsTwo.deletedRevisionDetails.length).to.equal(1);
      expect(cleanupDetailsTwo.deletedRevisionDetails[0]).to.equal('/scripts/index.js');

      const keysTwo = await cache.keys();
      expect(keysTwo.length).to.equal(cacheListTwo.length);

      const entries = await precacheControllerTwo._precacheDetailsModel._getAllEntries();
      expect(entries).to.deep.equal([]);
    });

    it(`should remove out of date entries`, async function() {
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
      logger.log.resetHistory();

      const cleanupDetailsOne = await precacheControllerOne.activate();
      expect(cleanupDetailsOne.deletedCacheRequests.length).to.equal(0);
      expect(cleanupDetailsOne.deletedRevisionDetails.length).to.equal(0);

      // Make sure we print some debug info.
      expect(logger.log.callCount).to.equal(0);

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
      logger.log.resetHistory();

      const cleanupDetailsTwo = await precacheControllerTwo.activate();
      expect(cleanupDetailsTwo.deletedCacheRequests.length).to.equal(1);
      expect(cleanupDetailsTwo.deletedCacheRequests[0]).to.equal('/index.1234.html');
      expect(cleanupDetailsTwo.deletedRevisionDetails.length).to.equal(1);
      expect(cleanupDetailsTwo.deletedRevisionDetails[0]).to.equal('/index.1234.html');

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

      const entries = await precacheControllerTwo._precacheDetailsModel._getAllEntries();
      expect(entries).to.deep.equal([
        {
          key: '/example.1234.css',
          primaryKey: '/example.1234.css',
          value: {
            revision: '/example.1234.css',
            url: '/example.1234.css',
          },
        },
        {
          key: '/index.4321.html',
          primaryKey: '/index.4321.html',
          value: {
            revision: '/index.4321.html',
            url: '/index.4321.html',
          },
        },
        {
          key: '/scripts/index.js',
          primaryKey: '/scripts/index.js',
          value: {
            revision: '1234',
            url: '/scripts/index.js',
          },
        },
        {
          key: '/scripts/stress.js?test=search&foo=bar',
          primaryKey: '/scripts/stress.js?test=search&foo=bar',
          value: {
            revision: '4321',
            url: '/scripts/stress.js?test=search&foo=bar',
          },
        },
      ]);

      // Make sure we print some debug info.
      if (process.env.NODE_ENV === 'production') {
        expect(logger.log.callCount).to.equal(0);
      } else {
        expect(logger.log.callCount).to.be.gt(0);
      }
    });

    it(`shouldn't open / create a cache when performing activate`, async function() {
      const precacheController = new PrecacheController();
      await precacheController.activate();

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
      await precacheControllerOne.activate();

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
      logger.log.resetHistory();

      await precacheControllerTwo.activate();

      // Make sure we didn't print any debug info.
      expect(logger.log.callCount).to.equal(0);
    });
  });

  describe(`getCachedUrls()`, function() {
    it(`should return the cached URLs`, function() {
      const precacheController = new PrecacheController();
      const cacheList = [
        '/index.1234.html',
        {url: '/example.1234.css'},
        {url: '/scripts/index.js', revision: '1234'},
        {url: '/scripts/stress.js?test=search&foo=bar', revision: '1234'},
      ];
      precacheController.addToCacheList(cacheList);

      const urls = precacheController.getCachedUrls();
      expect(urls).to.deep.equal([
        new URL('/index.1234.html', location).toString(),
        new URL('/example.1234.css', location).toString(),
        new URL('/scripts/index.js', location).toString(),
        new URL('/scripts/stress.js?test=search&foo=bar', location).toString(),
      ]);
    });
  });
});
