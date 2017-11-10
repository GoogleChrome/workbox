import {expect} from 'chai';
import {reset as iDBReset} from 'shelving-mock-indexeddb';

import CacheTimestampsModel from '../../../packages/workbox-cache-expiration/models/CacheTimestampsModel.mjs';
import {DBWrapper} from '../../../packages/workbox-core/_private/DBWrapper.mjs';

describe(`[workbox-cache-expiration] CacheTimestampsModel`, function() {
  beforeEach(function() {
    iDBReset();
  });

  after(function() {
    iDBReset();
  });

  describe(`constructor`, function() {
    it(`should constructor with a cacheName`, function() {
      new CacheTimestampsModel('test-cache');
    });

    // TODO Test bad input
  });

  describe(`setTimestamp()`, function() {
    it(`should set the timestamp for new entry`, async function() {
      const model = new CacheTimestampsModel('test-cache');
      const timestamp = Date.now();
      await model.setTimestamp('/', timestamp);

      const timestamps =
          await new DBWrapper(`workbox-cache-expiration`, 1).getAll('test-cache');

      expect(timestamps).to.deep.equal([{
        url: 'https://example.com/',
        timestamp,
      }]);
    });
  });

  describe(`getAllTimestamps`, function() {
    it(`should return timestamps`, async function() {
      const timestamp = Date.now();

      const model = new CacheTimestampsModel('test-cache');
      await model._db.put('test-cache', {url: '/', timestamp});

      const timestamps = await model.getAllTimestamps();
      expect(timestamps).to.deep.equal([{
        url: '/',
        timestamp: timestamp,
      }]);
    });

    it(`should return timestamps in order or oldest timestamp first`, async function() {
      const timestamp = Date.now();

      const model = new CacheTimestampsModel('test-cache');
      const db = model._db;
      await db.put('test-cache', {url: '/10', timestamp});
      await db.put('test-cache', {url: '/8', timestamp: timestamp - 2000});
      await db.put('test-cache', {url: '/9', timestamp: timestamp - 1000});
      await db.put('test-cache', {url: '/5', timestamp: timestamp - 5000});
      await db.put('test-cache', {url: '/1', timestamp: timestamp - 9000});
      await db.put('test-cache', {url: '/4', timestamp: timestamp - 6000});
      await db.put('test-cache', {url: '/3', timestamp: timestamp - 7000});
      await db.put('test-cache', {url: '/7', timestamp: timestamp - 3000});
      await db.put('test-cache', {url: '/6', timestamp: timestamp - 4000});
      await db.put('test-cache', {url: '/2', timestamp: timestamp - 8000});

      const timestamps = await model.getAllTimestamps();
      expect(timestamps).to.deep.equal([
        {
          url: '/1',
          timestamp: timestamp - 9000,
        },
        {
          url: '/2',
          timestamp: timestamp - 8000,
        },
        {
          url: '/3',
          timestamp: timestamp - 7000,
        },
        {
          url: '/4',
          timestamp: timestamp - 6000,
        },
        {
          url: '/5',
          timestamp: timestamp - 5000,
        },
        {
          url: '/6',
          timestamp: timestamp - 4000,
        },
        {
          url: '/7',
          timestamp: timestamp - 3000,
        },
        {
          url: '/8',
          timestamp: timestamp - 2000,
        },
        {
          url: '/9',
          timestamp: timestamp - 1000,
        },
        {
          url: '/10',
          timestamp: timestamp,
        },
      ]);
    });
  });
});
