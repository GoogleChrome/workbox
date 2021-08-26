/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {CacheTimestampsModel} from 'workbox-expiration/models/CacheTimestampsModel.mjs';
import {openDB} from 'idb';

describe(`CacheTimestampsModel`, function () {
  const sandbox = sinon.createSandbox();
  let db = null;

  beforeEach(async function () {
    sandbox.restore();
    db = await openDB('workbox-expiration', 1, {
      upgrade: CacheTimestampsModel.prototype._upgradeDb,
    });
    await db.clear('cache-entries');
  });

  after(function () {
    sandbox.restore();
  });

  const populateDb = async () => {
    await db.add('cache-entries', {
      id: `cache-one|${location.origin}/1`,
      url: `${location.origin}/1`,
      cacheName: 'cache-one',
      timestamp: 10,
    });
    await db.add('cache-entries', {
      id: `cache-one|${location.origin}/2`,
      url: `${location.origin}/2`,
      cacheName: 'cache-one',
      timestamp: 9,
    });
    await db.add('cache-entries', {
      id: `cache-one|${location.origin}/3`,
      url: `${location.origin}/3`,
      cacheName: 'cache-one',
      timestamp: 8,
    });
    await db.add('cache-entries', {
      id: `cache-one|${location.origin}/4`,
      url: `${location.origin}/4`,
      cacheName: 'cache-one',
      timestamp: 7,
    });
    await db.add('cache-entries', {
      id: `cache-one|${location.origin}/5`,
      url: `${location.origin}/5`,
      cacheName: 'cache-one',
      timestamp: 6,
    });
    await db.add('cache-entries', {
      id: `cache-two|${location.origin}/1`,
      url: `${location.origin}/1`,
      cacheName: 'cache-two',
      timestamp: 10,
    });
    await db.add('cache-entries', {
      id: `cache-two|${location.origin}/2`,
      url: `${location.origin}/2`,
      cacheName: 'cache-two',
      timestamp: 9,
    });
    await db.add('cache-entries', {
      id: `cache-two|${location.origin}/3`,
      url: `${location.origin}/3`,
      cacheName: 'cache-two',
      timestamp: 8,
    });
    await db.add('cache-entries', {
      id: `cache-three|${location.origin}/4`,
      url: `${location.origin}/4`,
      cacheName: 'cache-three',
      timestamp: 7,
    });
    await db.add('cache-entries', {
      id: `cache-three|${location.origin}/5`,
      url: `${location.origin}/5`,
      cacheName: 'cache-three',
      timestamp: 6,
    });

    return db;
  };

  describe(`constructor`, function () {
    it(`should constructor with a cacheName`, function () {
      new CacheTimestampsModel('test-cache');
    });

    // TODO Test bad input
  });

  describe(`expireEntries()`, function () {
    it(`should remove and return entries with timestamps below minTimestamp`, async function () {
      await populateDb();

      const model1 = new CacheTimestampsModel('cache-one');
      const removedEntries1 = await model1.expireEntries(8);
      expect(removedEntries1).to.deep.equal([
        `${location.origin}/4`,
        `${location.origin}/5`,
      ]);
      expect(await db.count('cache-entries')).to.equal(8);

      const model2 = new CacheTimestampsModel('cache-two');
      const removedEntries2 = await model2.expireEntries(9);
      expect(removedEntries2).to.deep.equal([`${location.origin}/3`]);
      expect(await db.count('cache-entries')).to.equal(7);
    });

    it(`should remove and return the oldest entries greater than maxCount`, async function () {
      await populateDb();

      const model1 = new CacheTimestampsModel('cache-one');
      const removedEntries1 = await model1.expireEntries(null, 2);
      expect(removedEntries1).to.deep.equal([
        `${location.origin}/3`,
        `${location.origin}/4`,
        `${location.origin}/5`,
      ]);
      expect(await db.count('cache-entries')).to.equal(7);

      const model2 = new CacheTimestampsModel('cache-two');
      const removedEntries2 = await model2.expireEntries(null, 1);
      expect(removedEntries2).to.deep.equal([
        `${location.origin}/2`,
        `${location.origin}/3`,
      ]);
      expect(await db.count('cache-entries')).to.equal(5);
    });

    it(`should work with minTimestamp and maxCount`, async function () {
      await populateDb();

      const model1 = new CacheTimestampsModel('cache-one');

      // This example tests minTimestamp being more restrictive.
      const removedEntries1 = await model1.expireEntries(9, 4);
      expect(removedEntries1).to.deep.equal([
        `${location.origin}/3`,
        `${location.origin}/4`,
        `${location.origin}/5`,
      ]);
      expect(await db.count('cache-entries')).to.equal(7);

      const model2 = new CacheTimestampsModel('cache-two');

      // This example tests maxCount being more restrictive.
      const removedEntries2 = await model2.expireEntries(5, 2);
      expect(removedEntries2).to.deep.equal([`${location.origin}/3`]);
      expect(await db.count('cache-entries')).to.equal(6);
    });

    it(`should return an empty array if nothing matches`, async function () {
      await populateDb();

      const model = new CacheTimestampsModel('cache-one');

      // This example tests minTimestamp being more restrictive.
      const removedEntries = await model.expireEntries(5, 5);
      expect(removedEntries).to.deep.equal([]);
      expect(await db.count('cache-entries')).to.equal(10);
    });
  });

  describe(`setTimestamp`, async function () {
    it(`should put entries in the database`, async function () {
      const model1 = new CacheTimestampsModel('cache-one');
      const model2 = new CacheTimestampsModel('cache-two');

      await model1.setTimestamp('/1', 100);
      await model1.setTimestamp('/2', 200);
      await model2.setTimestamp('/1', 300);

      expect(await db.getAll('cache-entries')).to.deep.equal([
        {
          id: `cache-one|${location.origin}/1`,
          url: `${location.origin}/1`,
          cacheName: 'cache-one',
          timestamp: 100,
        },
        {
          id: `cache-one|${location.origin}/2`,
          url: `${location.origin}/2`,
          cacheName: 'cache-one',
          timestamp: 200,
        },
        {
          id: `cache-two|${location.origin}/1`,
          url: `${location.origin}/1`,
          cacheName: 'cache-two',
          timestamp: 300,
        },
      ]);
    });
  });

  describe(`getTimestamp`, async function () {
    it(`should get an entry from the database by 'url'`, async function () {
      await populateDb();

      const model1 = new CacheTimestampsModel('cache-one');
      const model2 = new CacheTimestampsModel('cache-two');
      const model3 = new CacheTimestampsModel('cache-three');

      expect(await model1.getTimestamp('/2')).to.equal(9);
      expect(await model2.getTimestamp('/1')).to.equal(10);
      expect(await model3.getTimestamp('/5')).to.equal(6);
    });
  });
});
