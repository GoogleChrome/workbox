import {expect} from 'chai';
import {IDBFactory, IDBKeyRange, reset} from 'shelving-mock-indexeddb';
import makeServiceWorkerEnv from 'service-worker-mock';

import PrecacheEntry from '../../../../packages/workbox-precaching/models/PrecacheEntry.mjs';

const MODULE_PATH = `../../../../packages/workbox-precaching/models/PrecachedDetailsModel.mjs`;
const MOCK_LOCATION = 'https://example.com';

describe('[workbox-precaching] PrecachedDetailsModel', function() {
  let corePrivate;

  before(async function() {
    global.indexedDB = new IDBFactory();
    global.IDBKeyRange = IDBKeyRange;

    const swEnv = makeServiceWorkerEnv();
    // This is needed to ensure new URL('/', location), works.
    swEnv.location = MOCK_LOCATION;
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
      const isCached = await model.isEntryCached(
        new PrecacheEntry(
          {}, '/', '1234', new Request('/'), true
        )
      );
      expect(isCached).to.equal(false);
    });

    it(`should return false for entry with different revision`, async function() {
      const moduleExports = await import(MODULE_PATH);
      const PrecachedDetailsModel = moduleExports.default;

      const model = new PrecachedDetailsModel();

      await model.addEntry(
        new PrecacheEntry(
          {}, '/', '1234', new Request('/'), true
        )
      );

      const isCached = await model.isEntryCached(
        new PrecacheEntry(
          {}, '/', '4321', new Request('/'), true
        )
      );
      expect(isCached).to.equal(false);
    });

    it(`should return false for entry with revision but not in cache`, async function() {
      const moduleExports = await import(MODULE_PATH);
      const PrecachedDetailsModel = moduleExports.default;

      const model = new PrecachedDetailsModel();
      const entry = new PrecacheEntry(
        {}, '/', '1234', new Request('/'), true
      );

      await model.addEntry(entry);
      const isCached = await model.isEntryCached(entry);

      expect(isCached).to.equal(false);
    });

    it(`should return true if entry with revision and in cache`, async function() {
      const moduleExports = await import(MODULE_PATH);
      const PrecachedDetailsModel = moduleExports.default;

      const model = new PrecachedDetailsModel();
      const entry = new PrecacheEntry(
        {}, '/', '1234', new Request('/'), true
      );

      const cacheName = corePrivate.cacheNameProvider.getPrecacheName();
      const openCache = await caches.open(cacheName);
      openCache.put('/', new Response('Hello'));

      await model.addEntry(entry);

      const isCached = await model.isEntryCached(entry);
      expect(isCached).to.equal(true);
    });
  });

  describe('deleteEntry()', function() {
    // TODO add bad input tests

    it(`should be able to delete an entry`, async function() {
      const moduleExports = await import(MODULE_PATH);
      const PrecachedDetailsModel = moduleExports.default;

      const entry = new PrecacheEntry(
        {}, '/', '1234', new Request('/'), true
      );

      const model = new PrecachedDetailsModel();
      await model.deleteEntry(entry);
    });
  });
});
