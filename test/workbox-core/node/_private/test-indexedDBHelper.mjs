import {expect} from 'chai';
import {reset as iDBReset} from 'shelving-mock-indexeddb';

import indexedDBHelper from '../../../../packages/workbox-core/_private/indexedDBHelper.mjs';

describe(`[workbox-core] indexedDBHelper`, function() {
  beforeEach(function() {
    iDBReset();
  });

  after(function() {
    iDBReset();
  });

  describe('getDB()', function() {
    it(`should getDB()`, async function() {
      const dbWrapper = await indexedDBHelper.getDB(`db-name`, 1, () => {});
      expect(dbWrapper).to.exist;
    });
  });

  describe('DBWrapper', function() {
    it(`should get() nothing`, async function() {
      const DB_STORE_NAME = 'test-storename';
      const dbWrapper = await indexedDBHelper.getDB(`db-name`, 1, (db) => {
        db.createObjectStore(DB_STORE_NAME);
      });
      let result = await dbWrapper.get(DB_STORE_NAME, 'test-key');
      expect(result).to.equal(undefined);

      const value = {data: 'test-value'};
      await dbWrapper.put(DB_STORE_NAME, value, 'test-key');

      result = await dbWrapper.get(DB_STORE_NAME, 'test-key');
      expect(result).to.deep.equal(value);
    });

    it(`should getAll() nothing`, async function() {
      const DB_STORE_NAME = 'test-storename';
      const DB_INDEX = 'test-index';
      const dbWrapper = await indexedDBHelper.getDB(`db-name`, 1, (db) => {
        const objectStore = db.createObjectStore(DB_STORE_NAME, {keyPath: 'test-key'});
        objectStore.createIndex(DB_INDEX, DB_INDEX, {unique: false});
      });

      let result = await dbWrapper.getAll(DB_STORE_NAME, DB_INDEX);
      expect(result).to.deep.equal({});

      const value = {'test-key': 'test-value', [DB_INDEX]: 'test-index-value'};
      await dbWrapper.put(DB_STORE_NAME, value);

      result = await dbWrapper.getAll(DB_STORE_NAME, DB_INDEX);
      expect(result).to.deep.equal({'test-index-value': value});
    });

    it(`should delete nothing`, async function() {
      const DB_STORE_NAME = 'test-storename';
      const dbWrapper = await indexedDBHelper.getDB(`db-name`, 1, (db) => {
        db.createObjectStore(DB_STORE_NAME);
      });
      await dbWrapper.delete(DB_STORE_NAME, 'test-key');
    });
  });
});
