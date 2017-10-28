import indexedDBHelper from '../../../../packages/workbox-core/_private/indexedDBHelper.mjs';

describe(`[workbox-core] indexedDBHelper`, function() {
  describe('getDB()', function() {
    it(`should getDB()`, async function() {
      await indexedDBHelper.getDB(`db-name`, 1, () => {});
    });
  });
});
