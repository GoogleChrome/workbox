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

  describe(`_isEntryCached()`, function() {
    // TODO Test bad inputs

    it(`should return false for non-existant entry`, async function() {
      const model = new PrecachedDetailsModel();
      const isCached = await model._isEntryCached(
        new PrecacheEntry(
          {}, '/', '1234', true
        )
      );
      expect(isCached).to.equal(false);
    });

    it(`should return false for entry with different revision`, async function() {
      const model = new PrecachedDetailsModel();

      await model._addEntry(
        new PrecacheEntry(
          {}, '/', '1234', true
        )
      );

      const isCached = await model._isEntryCached(
        new PrecacheEntry(
          {}, '/', '4321', true
        )
      );
      expect(isCached).to.equal(false);
    });

    it(`should return false for entry with revision but not in cache`, async function() {
      const model = new PrecachedDetailsModel();
      const entry = new PrecacheEntry(
        {}, '/', '1234', true
      );

      await model._addEntry(entry);
      const isCached = await model._isEntryCached(entry);

      expect(isCached).to.equal(false);
    });

    it(`should return true if entry with revision and in cache`, async function() {
      const model = new PrecachedDetailsModel();
      const entry = new PrecacheEntry(
        {}, '/', '1234', true
      );

      const cacheName = _private.cacheNames.getPrecacheName();
      const openCache = await caches.open(cacheName);
      openCache.put('/', new Response('Hello'));

      await model._addEntry(entry);

      const isCached = await model._isEntryCached(entry);
      expect(isCached).to.equal(true);
    });
  });

  describe('_deleteEntry()', function() {
    // TODO add bad input tests

    it(`should be able to delete an entry`, async function() {
      const model = new PrecachedDetailsModel();
      await model._deleteEntry('/');
    });
  });
});
