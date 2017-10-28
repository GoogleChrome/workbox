import {expect} from 'chai';
import indexedDBHelper from '../../../../packages/workbox-core/_private/indexedDBHelper.mjs';

describe(`[workbox-core] indexedDBHelper`, function() {
  describe('getDB()', function() {
    it(`should getDB()`, async function() {
      const dbWrapper = await indexedDBHelper.getDB(`db-name`, 1, () => {});
      expect(dbWrapper).to.exist;
    });
  });
});
