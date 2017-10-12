import CacheTimestampsModel from '../../../packages/workbox-cache-expiration/models/CacheTimestampsModel.mjs';

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
      await model.setTimestamp('/', Date.now());
    });
  });
});
