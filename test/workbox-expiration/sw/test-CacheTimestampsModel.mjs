/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {expect} from 'chai';
import {reset as iDBReset} from 'shelving-mock-indexeddb';
import * as sinon from 'sinon';

import {CacheTimestampsModel} from '../../../packages/workbox-expiration/models/CacheTimestampsModel.mjs';
import {DBWrapper} from '../../../packages/workbox-core/_private/DBWrapper.mjs';

describe(`[workbox-expiration] CacheTimestampsModel`, function() {
  const sandbox = sinon.createSandbox();

  beforeEach(function() {
    sandbox.restore();
    iDBReset();
  });

  after(function() {
    sandbox.restore();
    iDBReset();
  });

  const createDb = async () => {
    return new DBWrapper('workbox-expiration', 1, {
      onupgradeneeded: (event) => {
        const db = event.target.result;
        const objStore = db.createObjectStore('cache-entries', {keyPath: 'id'});
        objStore.createIndex('cacheName', 'cacheName', {unique: false});
        objStore.createIndex('timestamp', 'timestamp', {unique: false});
      },
    });
  };

  const createAndPopulateDb = async () => {
    const db = await createDb();

    await db.add('cache-entries', {
      id: 'cache-one|https://example.com/1',
      url: 'https://example.com/1',
      cacheName: 'cache-one',
      timestamp: 10,
    });
    await db.add('cache-entries', {
      id: 'cache-one|https://example.com/2',
      url: 'https://example.com/2',
      cacheName: 'cache-one',
      timestamp: 9,
    });
    await db.add('cache-entries', {
      id: 'cache-one|https://example.com/3',
      url: 'https://example.com/3',
      cacheName: 'cache-one',
      timestamp: 8,
    });
    await db.add('cache-entries', {
      id: 'cache-one|https://example.com/4',
      url: 'https://example.com/4',
      cacheName: 'cache-one',
      timestamp: 7,
    });
    await db.add('cache-entries', {
      id: 'cache-one|https://example.com/5',
      url: 'https://example.com/5',
      cacheName: 'cache-one',
      timestamp: 6,
    });
    await db.add('cache-entries', {
      id: 'cache-two|https://example.com/1',
      url: 'https://example.com/1',
      cacheName: 'cache-two',
      timestamp: 10,
    });
    await db.add('cache-entries', {
      id: 'cache-two|https://example.com/2',
      url: 'https://example.com/2',
      cacheName: 'cache-two',
      timestamp: 9,
    });
    await db.add('cache-entries', {
      id: 'cache-two|https://example.com/3',
      url: 'https://example.com/3',
      cacheName: 'cache-two',
      timestamp: 8,
    });
    await db.add('cache-entries', {
      id: 'cache-three|https://example.com/4',
      url: 'https://example.com/4',
      cacheName: 'cache-three',
      timestamp: 7,
    });
    await db.add('cache-entries', {
      id: 'cache-three|https://example.com/5',
      url: 'https://example.com/5',
      cacheName: 'cache-three',
      timestamp: 6,
    });

    return db;
  };

  describe(`constructor`, function() {
    it(`should constructor with a cacheName`, function() {
      new CacheTimestampsModel('test-cache');
    });

    // TODO Test bad input
  });

  describe(`expireEntries()`, function() {
    it(`should remove and return entries with timestamps below minTimestamp`, async function() {
      const db = await createAndPopulateDb();

      const model1 = new CacheTimestampsModel('cache-one');
      const removedEntries1 = await model1.expireEntries(8);
      expect(removedEntries1).to.deep.equal([
        'https://example.com/4',
        'https://example.com/5',
      ]);
      expect(await db.count('cache-entries')).to.equal(8);

      const model2 = new CacheTimestampsModel('cache-two');
      const removedEntries2 = await model2.expireEntries(9);
      expect(removedEntries2).to.deep.equal([
        'https://example.com/3',
      ]);
      expect(await db.count('cache-entries')).to.equal(7);
    });

    it(`should remove and return the oldest entries greater than maxCount`, async function() {
      const db = await createAndPopulateDb();

      const model1 = new CacheTimestampsModel('cache-one');
      const removedEntries1 = await model1.expireEntries(null, 2);
      expect(removedEntries1).to.deep.equal([
        'https://example.com/3',
        'https://example.com/4',
        'https://example.com/5',
      ]);
      expect(await db.count('cache-entries')).to.equal(7);

      const model2 = new CacheTimestampsModel('cache-two');
      const removedEntries2 = await model2.expireEntries(null, 1);
      expect(removedEntries2).to.deep.equal([
        'https://example.com/2',
        'https://example.com/3',
      ]);
      expect(await db.count('cache-entries')).to.equal(5);
    });

    it(`should work with minTimestamp and maxCount`, async function() {
      const db = await createAndPopulateDb();

      const model1 = new CacheTimestampsModel('cache-one');

      // This example tests minTimestamp being more restrictive.
      const removedEntries1 = await model1.expireEntries(9, 4);
      expect(removedEntries1).to.deep.equal([
        'https://example.com/3',
        'https://example.com/4',
        'https://example.com/5',
      ]);
      expect(await db.count('cache-entries')).to.equal(7);

      const model2 = new CacheTimestampsModel('cache-two');

      // This example tests maxCount being more restrictive.
      const removedEntries2 = await model2.expireEntries(5, 2);
      expect(removedEntries2).to.deep.equal([
        'https://example.com/3',
      ]);
      expect(await db.count('cache-entries')).to.equal(6);
    });

    it(`should return an empty array if nothing matches`, async function() {
      const db = await createAndPopulateDb();

      const model = new CacheTimestampsModel('cache-one');

      // This example tests minTimestamp being more restrictive.
      const removedEntries = await model.expireEntries(5, 5);
      expect(removedEntries).to.deep.equal([]);
      expect(await db.count('cache-entries')).to.equal(10);
    });
  });

  describe(`setTimestamp`, async function() {
    it(`should put entries in the database`, async function() {
      const db = await createDb();

      const model1 = new CacheTimestampsModel('cache-one');
      const model2 = new CacheTimestampsModel('cache-two');

      await model1.setTimestamp('/1', 100);
      await model1.setTimestamp('/2', 200);
      await model2.setTimestamp('/1', 300);

      expect(await db.getAll('cache-entries')).to.deep.equal([
        {
          id: 'cache-one|https://example.com/1',
          url: 'https://example.com/1',
          cacheName: 'cache-one',
          timestamp: 100,
        },
        {
          id: 'cache-one|https://example.com/2',
          url: 'https://example.com/2',
          cacheName: 'cache-one',
          timestamp: 200,
        },
        {
          id: 'cache-two|https://example.com/1',
          url: 'https://example.com/1',
          cacheName: 'cache-two',
          timestamp: 300,
        },
      ]);
    });
  });

  describe(`getTimestamp`, async function() {
    it(`should get an entry from the database by 'url'`, async function() {
      await createAndPopulateDb();

      const model1 = new CacheTimestampsModel('cache-one');
      const model2 = new CacheTimestampsModel('cache-two');
      const model3 = new CacheTimestampsModel('cache-three');

      expect(await model1.getTimestamp('/2')).to.equal(9);
      expect(await model2.getTimestamp('/1')).to.equal(10);
      expect(await model3.getTimestamp('/5')).to.equal(6);
    });
  });
});
