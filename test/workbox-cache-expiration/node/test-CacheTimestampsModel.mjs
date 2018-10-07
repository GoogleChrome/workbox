/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {expect} from 'chai';
import {reset as iDBReset} from 'shelving-mock-indexeddb';
import * as sinon from 'sinon';

import CacheTimestampsModel from '../../../packages/workbox-cache-expiration/models/CacheTimestampsModel.mjs';
import {DBWrapper} from '../../../packages/workbox-core/_private/DBWrapper.mjs';

describe(`[workbox-cache-expiration] CacheTimestampsModel`, function() {
  const sandbox = sinon.createSandbox();

  beforeEach(function() {
    sandbox.restore();
    iDBReset();
  });

  after(function() {
    sandbox.restore();
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
          await new DBWrapper('test-cache', 2).getAll('test-cache');

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

  describe('_handleUpgrade', function() {
    it('should handle upgrade 0 (Doesnt exist)', () => {
      const objectStoreNames = [];
      const fakeDB = {
        objectStoreNames: {
          contains: (name) => objectStoreNames.indexOf(name) !== -1,
        },
        createIndex: sandbox.spy(),
        deleteObjectStore: sandbox.spy(),
        createObjectStore: sandbox.stub().callsFake(() => fakeDB),
      };

      const DB_NAME = 'test';
      const model = new CacheTimestampsModel(DB_NAME);
      model._handleUpgrade({
        target: {
          result: fakeDB,
        },
      });

      // Assert only create called
      expect(fakeDB.createObjectStore.callCount).to.equal(1);
      expect(fakeDB.createObjectStore.args[0][0]).to.equal(DB_NAME);

      expect(fakeDB.deleteObjectStore.callCount).to.equal(0);
    });

    it('should handle upgrade 1 > 2', () => {
      const objectStoreNames = ['workbox-cache-expiration'];
      const fakeDB = {
        objectStoreNames: {
          contains: (name) => objectStoreNames.indexOf(name) !== -1,
        },
        createIndex: sandbox.spy(),
        deleteObjectStore: sandbox.spy(),
        createObjectStore: sandbox.stub().callsFake(() => fakeDB),
      };

      const DB_NAME = 'test';
      const model = new CacheTimestampsModel(DB_NAME);
      model._handleUpgrade({
        oldVersion: 1,
        target: {
          result: fakeDB,
        },
      });

      // Assert only create called
      expect(fakeDB.createObjectStore.callCount).to.equal(1);
      expect(fakeDB.createObjectStore.args[0][0]).to.equal(DB_NAME);

      expect(fakeDB.deleteObjectStore.callCount).to.equal(1);
      expect(fakeDB.deleteObjectStore.args[0][0]).to.equal('workbox-cache-expiration');
    });
  });
});
