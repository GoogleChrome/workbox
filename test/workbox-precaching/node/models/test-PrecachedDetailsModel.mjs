import {expect} from 'chai';
import {IDBFactory, IDBKeyRange, reset} from 'shelving-mock-indexeddb';
import makeServiceWorkerEnv from 'service-worker-mock';

const MODULE_PATH = `../../../../packages/workbox-precaching/models/PrecachedDetailsModel.mjs`;

describe('[workbox-precaching] PrecachedDetailsModel', function() {
  let corePrivate;

  before(async function() {
    global.indexedDB = new IDBFactory();
    global.IDBKeyRange = IDBKeyRange;

    const swEnv = makeServiceWorkerEnv();
    // This is needed to ensure new URL('/', location), works.
    // swEnv.location = MOCK_LOCATION;
    Object.assign(global, swEnv);

    const coreModule = await import('../../../../packages/workbox-core/index.mjs');
    corePrivate = coreModule._private;
  });

  beforeEach(function() {
    reset();
  });

  describe('constructor', function() {
    it(`should construct with no input`, async function() {
      const moduleExports = await import(MODULE_PATH);
      const PrecachedDetailsModel = moduleExports.default;
      const model = new PrecachedDetailsModel();
      expect(model._cacheName).to.equal(`workbox-precache-/`);
    });

    it(`should construct with custom cacheName`, async function() {
      const moduleExports = await import(MODULE_PATH);
      const PrecachedDetailsModel = moduleExports.default;
      const model = new PrecachedDetailsModel(`test-cache-name`);
      expect(model._cacheName).to.equal(`test-cache-name`);
    });

    // TODO Bad cache name input
  });

  describe(`isEntryCached()`, function() {
    // TODO Test bad inputs

    it(`should return false for non-existant entry`, async function() {
      const moduleExports = await import(MODULE_PATH);
      const PrecachedDetailsModel = moduleExports.default;
      const model = new PrecachedDetailsModel();
      const isCached = await model.isEntryCached({
        _entryId: `/`,
        _revision: `4321`,
      });
      expect(isCached).to.equal(false);
    });

    it(`should return false for entry with different revision`, async function() {
      const moduleExports = await import(MODULE_PATH);
      const PrecachedDetailsModel = moduleExports.default;

      const model = new PrecachedDetailsModel();

      await model.addEntry({
        _entryId: '/',
        _revision: '1234',
      });

      const isCached = await model.isEntryCached({
        _entryId: `/`,
        _revision: `4321`,
      });
      expect(isCached).to.equal(false);
    });

    it(`should return false for entry with revision but not in cache`, async function() {
      const moduleExports = await import(MODULE_PATH);
      const PrecachedDetailsModel = moduleExports.default;

      const model = new PrecachedDetailsModel();

      await model.addEntry({
        _entryId: '/',
        _revision: '1234',
        _request: new Request('/'),
      });

      const isCached = await model.isEntryCached({
        _entryId: `/`,
        _revision: `1234`,
        _request: new Request('/'),
      });
      expect(isCached).to.equal(false);
    });

    it(`should return true if entry with revision and in cache`, async function() {
      const moduleExports = await import(MODULE_PATH);
      const PrecachedDetailsModel = moduleExports.default;

      const model = new PrecachedDetailsModel();

      await model.addEntry({
        _entryId: '/',
        _revision: '1234',
        _request: new Request('/'),
      });

      const cacheName = corePrivate.cacheNameProvider.getPrecacheName();
      const openCache = await caches.open(cacheName);
      openCache.put('/', new Response('Hello'));

      const isCached = await model.isEntryCached({
        _entryId: `/`,
        _revision: `1234`,
        _request: new Request('/'),
      });
      expect(isCached).to.equal(true);
    });
  });

  describe('deleteEntry()', function() {
    // TODO add bad input tests

    it(`should be able to delete an entry`, async function() {
      const moduleExports = await import(MODULE_PATH);
      const PrecachedDetailsModel = moduleExports.default;

      const model = new PrecachedDetailsModel();
      await model.deleteEntry({
        _entryId: '/',
      });
    });
  });
});
