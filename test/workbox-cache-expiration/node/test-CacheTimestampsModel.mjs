import {expect} from 'chai';

import CacheTimestampsModel from '../../../packages/workbox-cache-expiration/models/CacheTimestampsModel.mjs';
import indexedDBHelper from '../../../packages/workbox-core/utils/indexedDBHelper.mjs';

describe(`[workbox-cache-expiration] CacheTimestampsModel`, function() {
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

      const db = await indexedDBHelper.getDB(`workbox-cache-expiration`, 1);
      const timestamps = await db.getAll('test-cache');

      expect(timestamps['/']).to.exist;
      expect(timestamps['/']).to.deep.equal({
        url: '/',
        timestamp,
      });
    });
  });

  describe(`getAllTimestamps`, function() {
    it(`should return timestamps`, async function() {
      const timestamp = Date.now();
      const db = await indexedDBHelper.getDB(`workbox-cache-expiration`, 1);
      await db.put('test-cache', {url: '/', timestamp});

      const model = new CacheTimestampsModel('test-cache');
      const timestamps = await model.getAllTimestamps();
      expect(timestamps).to.deep.equal({
        '/': {
          url: '/',
          timestamp: timestamp,
        },
      });
    });
  });
});
