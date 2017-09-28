import {expect} from 'chai';
import sinon from 'sinon';
import clearRequire from 'clear-require';
import makeServiceWorkerEnv from 'service-worker-mock';
import {IDBFactory, IDBKeyRange, reset} from 'shelving-mock-indexeddb';

import expectError from '../../../../infra/utils/expectError';
import generateTestVariants from '../../../../infra/utils/generate-variant-tests';
import '../../../mocks/mock-fetch';

const PRECACHE_MANAGER_PATH = '../../../../packages/workbox-precaching/controllers/PrecacheController.mjs';
const MOCK_LOCATION = 'https://example.com';

describe(`[workbox-precaching] PrecacheController`, function() {
  const sandbox = sinon.sandbox.create();
  let logger;
  let cacheNameProvider;

  before(function() {
    global.indexedDB = new IDBFactory();
    global.IDBKeyRange = IDBKeyRange;

    const swEnv = makeServiceWorkerEnv();

    // This is needed to ensure new URL('/', location), works.
    swEnv.location = MOCK_LOCATION;

    Object.assign(global, swEnv);
  });

  beforeEach(async function() {
    process.env.NODE_ENV = 'dev';
    clearRequire.all();
    const coreModule = await import('../../../../packages/workbox-core/index.mjs');

    logger = coreModule._private.logger;
    cacheNameProvider = coreModule._private.cacheNameProvider;

    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((cacheName) => {
      return caches.delete(cacheName);
    }));

    reset();
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe(`constructor`, function() {
    it(`should construct without any inputs`, async function() {
      const PrecacheController = (await import(PRECACHE_MANAGER_PATH)).default;
      expect(() => {
        new PrecacheController();
      }).to.not.throw();
    });

    it(`should construct with a valid cache name`, async function() {
      const PrecacheController = (await import(PRECACHE_MANAGER_PATH)).default;
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
    generateTestVariants(`should throw when passing in non-array values`, badTopLevelInputs, async (variant) => {
      const PrecacheController = (await import(PRECACHE_MANAGER_PATH)).default;
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
    generateTestVariants(`should throw when passing in invalid inputs in the array.`, badNestedInputs, async (variant) => {
      const PrecacheController = (await import(PRECACHE_MANAGER_PATH)).default;
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

      it(`should add ${groupName} to cache list`, async function() {
        const PrecacheController = (await import(PRECACHE_MANAGER_PATH)).default;
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
        const PrecacheController = (await import(PRECACHE_MANAGER_PATH)).default;
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
      const PrecacheController = (await import(PRECACHE_MANAGER_PATH)).default;
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
      const PrecacheController = (await import(PRECACHE_MANAGER_PATH)).default;
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
      const PrecacheController = (await import(PRECACHE_MANAGER_PATH)).default;
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
      // Prevent logs in the mocha output
      sandbox.stub(logger, 'warn');
      sandbox.stub(logger, 'debug');
      sandbox.stub(logger, 'log');

      const PrecacheController = (await import(PRECACHE_MANAGER_PATH)).default;
      const precacheController = new PrecacheController();
      return precacheController.install();
    });

    it('should precache assets (with cache busting via search params)', async function() {
      // Prevent logs in the mocha output
      sandbox.stub(logger, 'warn');
      sandbox.stub(logger, 'debug');
      const logStub = sandbox.stub(logger, 'log');

      const PrecacheController = (await import(PRECACHE_MANAGER_PATH)).default;
      const precacheController = new PrecacheController();
      const cacheList = [
        '/index.1234.html',
        {url: '/example.1234.css'},
        {url: '/scripts/index.js', revision: '1234'},
        {url: '/scripts/stress.js?test=search&foo=bar', revision: '1234'},
      ];
      precacheController.addToCacheList(cacheList);

      // Reset as addToCacheList will log.
      logStub.reset();

      const updateInfo = await precacheController.install();
      expect(updateInfo.updatedEntries.length).to.equal(cacheList.length);
      expect(updateInfo.notUpdatedEntries.length).to.equal(0);


      const cache = await caches.open(cacheNameProvider.getPrecacheName());
      const keys = await cache.keys();
      expect(keys.length).to.equal(cacheList.length);

      const urls = cacheList.map((entry) => entry.url || entry);
      await Promise.all(urls.map(async (url) => {
        const cachedResponse = await cache.match(url);
        expect(cachedResponse).to.exist;
      }));

      // Make sure we print some debug info.
      expect(logStub.callCount).to.be.gt(0);
    });

    it('should not log install details on production', async function() {
      process.env.NODE_ENV = 'production';

      // Prevent logs in the mocha output
      sandbox.stub(logger, 'warn');
      sandbox.stub(logger, 'debug');
      const logStub = sandbox.stub(logger, 'log');

      const PrecacheController = (await import(PRECACHE_MANAGER_PATH)).default;
      const precacheController = new PrecacheController();
      precacheController.addToCacheList([
        '/index.1234.html',
        {url: '/example.1234.css'},
        {url: '/scripts/index.js', revision: '1234'},
      ]);

      await precacheController.install();

      expect(logStub.callCount).to.equal(0);
    });

    it(`should clean redirected precache entries`, async function() {
      // Prevent logs in the mocha output
      sandbox.stub(logger, 'warn');
      sandbox.stub(logger, 'debug');
      sandbox.stub(logger, 'log');

      const fetchStub = sandbox.stub(global, 'fetch');
      fetchStub.callsFake(() => {
        const response = new Response('Redirected Response');
        response.redirected = true;
        return response;
      });

      const PrecacheController = (await import(PRECACHE_MANAGER_PATH)).default;
      const precacheController = new PrecacheController();
      precacheController.addToCacheList([
        '/index.1234.html',
        {url: '/example.1234.css'},
        {url: '/scripts/index.js', revision: '1234'},
      ]);

      await precacheController.install();
    });

    it(`should use the desired cache name`, async function() {
      // Prevent logs in the mocha output
      sandbox.stub(logger, 'warn');
      sandbox.stub(logger, 'debug');
      sandbox.stub(logger, 'log');

      const PrecacheController = (await import(PRECACHE_MANAGER_PATH)).default;
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
      // Prevent logs in the mocha output
      sandbox.stub(logger, 'warn');
      sandbox.stub(logger, 'debug');
      const logStub = sandbox.stub(logger, 'log');
      const cache = await caches.open(cacheNameProvider.getPrecacheName());

      /*
      First precache some entries
      */
      const PrecacheController = (await import(PRECACHE_MANAGER_PATH)).default;
      const precacheControllerOne = new PrecacheController();
      const cacheListOne = [
        '/index.1234.html',
        {url: '/example.1234.css'},
        {url: '/scripts/index.js', revision: '1234'},
        {url: '/scripts/stress.js?test=search&foo=bar', revision: '1234'},
      ];
      precacheControllerOne.addToCacheList(cacheListOne);

      // Reset as addToCacheList will log.
      logStub.reset();

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

      // Make sure we print some debug info.
      expect(logStub.callCount).to.be.gt(0);

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
      logStub.reset();

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

      // Make sure we print some debug info.
      expect(logStub.callCount).to.be.gt(0);
    });
  });

  describe(`cleanup()`, function() {
    // TODO: This requires service worker mocks to be fixed.
    // https://github.com/pinterest/service-workers/issues/40
    // https://github.com/pinterest/service-workers/issues/38
    it.skip(`should remove out of date entries`, async function() {
      // Prevent logs in the mocha output
      sandbox.stub(logger, 'warn');
      sandbox.stub(logger, 'debug');
      const logStub = sandbox.stub(logger, 'log');

      const cache = await caches.open(cacheNameProvider.getPrecacheName());

      /*
      First precache some entries
      */
      const PrecacheController = (await import(PRECACHE_MANAGER_PATH)).default;
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
      logStub.reset();

      const cleanupDetailsOne = await precacheControllerOne.cleanup();
      expect(cleanupDetailsOne.deletedCacheRequests.length).to.equal(0);
      expect(cleanupDetailsOne.deletedRevisionDetails.length).to.equal(0);

      // Make sure we print some debug info.
      expect(logStub.callCount).to.equal(0);

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
      logStub.reset();

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
      expect(logStub.callCount).to.be.gt(0);
    });

    it(`shouldn't open / create a cache when performing cleanup`, async function() {
      // Prevent logs in the mocha output
      sandbox.stub(logger, 'warn');
      sandbox.stub(logger, 'debug');
      sandbox.stub(logger, 'log');

      const PrecacheController = (await import(PRECACHE_MANAGER_PATH)).default;
      const precacheController = new PrecacheController();
      await precacheController.cleanup();

      const hasCache = await caches.has(cacheNameProvider.getPrecacheName());
      expect(hasCache).to.equal(false);
    });

    it(`shouldn't log anything on prod`, async function() {
      process.env.NODE_ENV = 'production';

      // Prevent logs in the mocha output
      sandbox.stub(logger, 'warn');
      sandbox.stub(logger, 'debug');
      const logStub = sandbox.stub(logger, 'log');

      const PrecacheController = (await import(PRECACHE_MANAGER_PATH)).default;
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
      logStub.reset();

      await precacheControllerTwo.cleanup();

      // Make sure we didn't print any debug info.
      expect(logStub.callCount).to.equal(0);
    });
  });
});
