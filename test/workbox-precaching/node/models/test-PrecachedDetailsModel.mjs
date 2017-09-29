import {expect} from 'chai';
import {IDBFactory, IDBKeyRange, reset} from 'shelving-mock-indexeddb';
import {_private} from '../../../../packages/workbox-core/index.mjs';
import PrecachedDetailsModel from '../../../../packages/workbox-precaching/models/PrecachedDetailsModel.mjs';
import PrecacheEntry from '../../../../packages/workbox-precaching/models/PrecacheEntry.mjs';

describe('[workbox-precaching] PrecachedDetailsModel', function() {
  before(async function() {
    global.indexedDB = new IDBFactory();
    global.IDBKeyRange = IDBKeyRange;
  });

  beforeEach(function() {
    reset();
  });

  describe('constructor', function() {
    it(`should construct with no input`, async function() {
      const model = new PrecachedDetailsModel();
      expect(model._cacheName).to.equal(`workbox-precache-/`);
    });

    it(`should construct with custom cacheName`, async function() {
      const model = new PrecachedDetailsModel(`test-cache-name`);
      expect(model._cacheName).to.equal(`test-cache-name`);
    });

    // TODO Bad cache name input
  });

  describe(`isEntryCached()`, function() {
    // TODO Test bad inputs

    it(`should return false for non-existant entry`, async function() {
      const model = new PrecachedDetailsModel();
      const isCached = await model.isEntryCached(
        new PrecacheEntry(
          {}, '/', '1234', new Request('/'), true
        )
      );
      expect(isCached).to.equal(false);
    });

    it(`should return false for entry with different revision`, async function() {
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
      const model = new PrecachedDetailsModel();
      const entry = new PrecacheEntry(
        {}, '/', '1234', new Request('/'), true
      );

      await model.addEntry(entry);
      const isCached = await model.isEntryCached(entry);

      expect(isCached).to.equal(false);
    });

    it(`should return true if entry with revision and in cache`, async function() {
      const model = new PrecachedDetailsModel();
      const entry = new PrecacheEntry(
        {}, '/', '1234', new Request('/'), true
      );

      const cacheName = _private.cacheNameProvider.getPrecacheName();
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
      const model = new PrecachedDetailsModel();
      await model.deleteEntry('/');
    });
  });
});
