/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {expect} from 'chai';
import {reset} from 'shelving-mock-indexeddb';
import expectError from '../../../../infra/testing/expectError';
import {devOnly} from '../../../../infra/testing/env-it';

import {DB_NAME, DB_VERSION, OBJECT_STORE_NAME, INDEXED_PROP} from
  '../../../../packages/workbox-background-sync/utils/constants.mjs';
import {QueueStore} from
  '../../../../packages/workbox-background-sync/models/QueueStore.mjs';
import {DBWrapper} from
  '../../../../packages/workbox-core/_private/DBWrapper.mjs';
import StorableRequest from
  '../../../../packages/workbox-background-sync/models/StorableRequest.mjs';

const getObjectStoreEntries = async (version = DB_VERSION) => {
  return await new DBWrapper(DB_NAME, version).getAll(OBJECT_STORE_NAME);
};

describe(`[workbox-background-sync] QueueStore`, function() {
  beforeEach(function() {
    reset();
  });

  after(async function() {
    reset();
  });

  describe(`constructor`, function() {
    it(`should associate the queue name with a Queue instance`, function() {
      const queueStore = new QueueStore('foo');
      expect(queueStore._queueName).to.equal('foo');
    });
  });

  describe(`_upgradeDb`, function() {
    it(`should handle upgrading from no previous version`, async function() {
      const queueStore = new QueueStore('a');

      const sr1 = await StorableRequest.fromRequest(new Request('/one'));
      const sr2 = await StorableRequest.fromRequest(new Request('/two'));

      await queueStore.pushEntry({
        requestData: sr1.toObject(),
      });
      await queueStore.pushEntry({
        requestData: sr2.toObject(),
      });

      const entries = await getObjectStoreEntries();
      expect(entries).to.have.lengthOf(2);
      expect(entries[0].id).to.equal(1);
      expect(entries[0].queueName).to.equal('a');
      expect(entries[0].requestData.url).to.equal('/one');
      expect(entries[1].id).to.equal(2);
      expect(entries[1].queueName).to.equal('a');
      expect(entries[1].requestData.url).to.equal('/two');
    });

    it(`should handle upgrading from version 1 to 2`, async function() {
      const dbv1 = new DBWrapper(DB_NAME, 1, {
        onupgradeneeded: (event) => event.target.result
            .createObjectStore(OBJECT_STORE_NAME, {autoIncrement: true})
            .createIndex(INDEXED_PROP, INDEXED_PROP, {unique: false}),
      });

      await dbv1.add(OBJECT_STORE_NAME, {
        queueName: 'a',
        storableRequest: {
          url: '/one',
          timestamp: 123,
          requestInit: {
            method: 'POST',
            mode: 'no-cors',
            headers: {
              'x-foo': 'bar',
              'x-qux': 'baz',
            },
          },
        },
      });

      await dbv1.add(OBJECT_STORE_NAME, {
        queueName: 'b',
        storableRequest: {
          url: '/two',
          timestamp: 234,
          requestInit: {
            mode: 'cors',
          },
        },
      });

      await dbv1.add(OBJECT_STORE_NAME, {
        queueName: 'a',
        storableRequest: {
          url: '/three',
          timestamp: 345,
          requestInit: {},
        },
      });

      // Creating the new `QueueStore` should register the upgrade logic.
      new QueueStore('a');
      const queueStore2 = new QueueStore('b');
      const sr = await StorableRequest.fromRequest(new Request('/four'));
      const requestData = sr.toObject();
      const timestamp = Date.now();
      const metadata = {a: '1'};

      // Pushing an entry should trigger the database open (and the upgrade).
      queueStore2.pushEntry({requestData, timestamp, metadata});

      const entries = await getObjectStoreEntries();
      expect(entries).to.have.lengthOf(4);
      expect(entries[0].id).to.equal(1);
      expect(entries[0].timestamp).to.equal(123);
      expect(entries[0].queueName).to.equal('a');
      expect(entries[0].requestData.url).to.equal('/one');
      expect(entries[1].id).to.equal(2);
      expect(entries[1].timestamp).to.equal(234);
      expect(entries[1].queueName).to.equal('b');
      expect(entries[1].requestData.url).to.equal('/two');
      expect(entries[2].id).to.equal(3);
      expect(entries[2].timestamp).to.equal(345);
      expect(entries[2].queueName).to.equal('a');
      expect(entries[2].requestData.url).to.equal('/three');
      expect(entries[3].id).to.equal(4);
      expect(entries[3].timestamp).to.equal(timestamp);
      expect(entries[3].metadata).to.deep.equal(metadata);
      expect(entries[3].queueName).to.equal('b');
      expect(entries[3].requestData.url).to.equal('/four');
    });
  });

  describe(`pushEntry`, function() {
    it(`should append an entry to IDB with the right queue name`, async function() {
      const queueStore1 = new QueueStore('a');
      const queueStore2 = new QueueStore('b');

      const sr1 = await StorableRequest.fromRequest(new Request('/one'));
      const sr2 = await StorableRequest.fromRequest(new Request('/two'));
      const sr3 = await StorableRequest.fromRequest(new Request('/three'));
      const sr4 = await StorableRequest.fromRequest(new Request('/four'));
      const sr5 = await StorableRequest.fromRequest(new Request('/five'));

      await queueStore1.pushEntry({
        requestData: sr1.toObject(),
        timestamp: 1000,
        metadata: {name: 'meta1'},
      });
      await queueStore2.pushEntry({
        requestData: sr2.toObject(),
        timestamp: 2000,
        metadata: {name: 'meta2'},
      });
      await queueStore2.pushEntry({
        requestData: sr3.toObject(),
        timestamp: 3000,
        metadata: {name: 'meta3'},
      });
      await queueStore2.pushEntry({
        requestData: sr4.toObject(),
        timestamp: 4000,
        metadata: {name: 'meta4'},
      });
      await queueStore1.pushEntry({
        requestData: sr5.toObject(),
        timestamp: 5000,
        metadata: {name: 'meta5'},
      });

      const entries = await getObjectStoreEntries();

      expect(entries).to.have.lengthOf(5);
      expect(entries[0].id).to.equal(1);
      expect(entries[0].queueName).to.equal('a');
      expect(entries[0].requestData.url).to.equal('/one');
      expect(entries[0].timestamp).to.equal(1000);
      expect(entries[0].metadata).to.deep.equal({name: 'meta1'});
      expect(entries[1].id).to.equal(2);
      expect(entries[1].queueName).to.equal('b');
      expect(entries[1].requestData.url).to.equal('/two');
      expect(entries[1].timestamp).to.equal(2000);
      expect(entries[1].metadata).to.deep.equal({name: 'meta2'});
      expect(entries[2].id).to.equal(3);
      expect(entries[2].queueName).to.equal('b');
      expect(entries[2].requestData.url).to.equal('/three');
      expect(entries[2].timestamp).to.equal(3000);
      expect(entries[2].metadata).to.deep.equal({name: 'meta3'});
      expect(entries[3].id).to.equal(4);
      expect(entries[3].queueName).to.equal('b');
      expect(entries[3].requestData.url).to.equal('/four');
      expect(entries[3].timestamp).to.equal(4000);
      expect(entries[3].metadata).to.deep.equal({name: 'meta4'});
      expect(entries[4].id).to.equal(5);
      expect(entries[4].queueName).to.equal('a');
      expect(entries[4].requestData.url).to.equal('/five');
      expect(entries[4].timestamp).to.equal(5000);
      expect(entries[4].metadata).to.deep.equal({name: 'meta5'});
    });

    devOnly.it(`throws if not given an entry object`, function() {
      return expectError(async () => {
        const queueStore = new QueueStore('a');
        await queueStore.pushEntry();
      }, 'incorrect-type');
    });

    devOnly.it(`throws if not given an entry object with requestData`, function() {
      return expectError(async () => {
        const queueStore = new QueueStore('a');
        await queueStore.pushEntry({});
      }, 'incorrect-type');
    });
  });

  describe(`unshiftEntry`, function() {
    it(`should prepend an entry to IDB with the right queue name and ID`, async function() {
      const queueStore1 = new QueueStore('a');
      const queueStore2 = new QueueStore('b');

      const sr1 = await StorableRequest.fromRequest(new Request('/one'));
      const sr2 = await StorableRequest.fromRequest(new Request('/two'));
      const sr3 = await StorableRequest.fromRequest(new Request('/three'));
      const sr4 = await StorableRequest.fromRequest(new Request('/four'));
      const sr5 = await StorableRequest.fromRequest(new Request('/five'));

      await queueStore1.unshiftEntry({
        requestData: sr1.toObject(),
        timestamp: 1000,
        metadata: {name: 'meta1'},
      });
      await queueStore2.unshiftEntry({
        requestData: sr2.toObject(),
        timestamp: 2000,
        metadata: {name: 'meta2'},
      });
      await queueStore2.unshiftEntry({
        requestData: sr3.toObject(),
        timestamp: 3000,
        metadata: {name: 'meta3'},
      });
      await queueStore2.unshiftEntry({
        requestData: sr4.toObject(),
        timestamp: 4000,
        metadata: {name: 'meta4'},
      });
      await queueStore1.unshiftEntry({
        requestData: sr5.toObject(),
        timestamp: 5000,
        metadata: {name: 'meta5'},
      });
      const entries = await getObjectStoreEntries();
      expect(entries).to.have.lengthOf(5);
      expect(entries[0].id).to.equal(-3);
      expect(entries[0].timestamp).to.equal(5000);
      expect(entries[0].metadata).to.deep.equal({name: 'meta5'});
      expect(entries[0].queueName).to.equal('a');
      expect(entries[0].requestData.url).to.equal('/five');
      expect(entries[1].id).to.equal(-2);
      expect(entries[1].timestamp).to.equal(4000);
      expect(entries[1].metadata).to.deep.equal({name: 'meta4'});
      expect(entries[1].queueName).to.equal('b');
      expect(entries[1].requestData.url).to.equal('/four');
      expect(entries[2].id).to.equal(-1);
      expect(entries[2].timestamp).to.equal(3000);
      expect(entries[2].metadata).to.deep.equal({name: 'meta3'});
      expect(entries[2].queueName).to.equal('b');
      expect(entries[2].requestData.url).to.equal('/three');
      expect(entries[3].id).to.equal(0);
      expect(entries[3].timestamp).to.equal(2000);
      expect(entries[3].metadata).to.deep.equal({name: 'meta2'});
      expect(entries[3].queueName).to.equal('b');
      expect(entries[3].requestData.url).to.equal('/two');
      expect(entries[4].id).to.equal(1);
      expect(entries[4].timestamp).to.equal(1000);
      expect(entries[4].metadata).to.deep.equal({name: 'meta1'});
      expect(entries[4].queueName).to.equal('a');
      expect(entries[4].requestData.url).to.equal('/one');
    });

    devOnly.it(`throws if not given an entry object`, function() {
      return expectError(async () => {
        const queueStore = new QueueStore('a');
        await queueStore.unshiftEntry();
      }, 'incorrect-type');
    });

    devOnly.it(`throws if not given an entry object with requestData`, function() {
      return expectError(async () => {
        const queueStore = new QueueStore('a');
        await queueStore.unshiftEntry({});
      }, 'incorrect-type');
    });
  });

  describe(`shiftEntry`, function() {
    it(`should remove and return the first entry in IDB with the matching queue name`, async function() {
      const queueStore1 = new QueueStore('a');
      const queueStore2 = new QueueStore('b');

      const sr1 = await StorableRequest.fromRequest(new Request('/one'));
      const sr2 = await StorableRequest.fromRequest(new Request('/two'));
      const sr3 = await StorableRequest.fromRequest(new Request('/three'));
      const sr4 = await StorableRequest.fromRequest(new Request('/four'));
      const sr5 = await StorableRequest.fromRequest(new Request('/five'));

      await queueStore1.pushEntry({
        requestData: sr1.toObject(),
        timestamp: 1000,
        metadata: {name: 'meta1'},
      });
      await queueStore2.pushEntry({
        requestData: sr2.toObject(),
        timestamp: 2000,
        metadata: {name: 'meta2'},
      });
      await queueStore2.pushEntry({
        requestData: sr3.toObject(),
        timestamp: 3000,
        metadata: {name: 'meta3'},
      });
      await queueStore2.pushEntry({
        requestData: sr4.toObject(),
        timestamp: 4000,
        metadata: {name: 'meta4'},
      });
      await queueStore1.pushEntry({
        requestData: sr5.toObject(),
        timestamp: 5000,
        metadata: {name: 'meta5'},
      });

      let entries = await getObjectStoreEntries();
      expect(entries).to.have.lengthOf(5);

      const sr2a = await queueStore2.shiftEntry();
      expect(sr2a.requestData).to.deep.equal(sr2.toObject());
      expect(sr2a.timestamp).to.equal(2000);
      expect(sr2a.metadata).to.deep.equal({name: 'meta2'});
      // It should not return the ID or queue name.
      expect(sr2a.id).to.be.undefined;
      expect(sr2a.queueName).to.be.undefined;

      entries = await getObjectStoreEntries();
      expect(entries).to.have.lengthOf(4);
      expect(entries[0].id).to.equal(1);
      expect(entries[1].id).to.equal(3);
      expect(entries[2].id).to.equal(4);
      expect(entries[3].id).to.equal(5);

      const sr1a = await queueStore1.shiftEntry();
      expect(sr1a.requestData).to.deep.equal(sr1.toObject());
      expect(sr1a.timestamp).to.equal(1000);
      expect(sr1a.metadata).to.deep.equal({name: 'meta1'});
      // It should not return the ID or queue name.
      expect(sr1a.id).to.be.undefined;
      expect(sr1a.queueName).to.be.undefined;

      entries = await getObjectStoreEntries();
      expect(entries).to.have.lengthOf(3);
      expect(entries[0].id).to.equal(3);
      expect(entries[1].id).to.equal(4);
      expect(entries[2].id).to.equal(5);
    });
  });

  describe(`popEntry`, function() {
    it(`should remove and return the last entry in IDB with the matching queue name`, async function() {
      const queueStore1 = new QueueStore('a');
      const queueStore2 = new QueueStore('b');

      const sr1 = await StorableRequest.fromRequest(new Request('/one'));
      const sr2 = await StorableRequest.fromRequest(new Request('/two'));
      const sr3 = await StorableRequest.fromRequest(new Request('/three'));
      const sr4 = await StorableRequest.fromRequest(new Request('/four'));
      const sr5 = await StorableRequest.fromRequest(new Request('/five'));

      await queueStore1.pushEntry({
        requestData: sr1.toObject(),
        timestamp: 1000,
        metadata: {name: 'meta1'},
      });
      await queueStore2.pushEntry({
        requestData: sr2.toObject(),
        timestamp: 2000,
        metadata: {name: 'meta2'},
      });
      await queueStore2.pushEntry({
        requestData: sr3.toObject(),
        timestamp: 3000,
        metadata: {name: 'meta3'},
      });
      await queueStore2.pushEntry({
        requestData: sr4.toObject(),
        timestamp: 4000,
        metadata: {name: 'meta4'},
      });
      await queueStore1.pushEntry({
        requestData: sr5.toObject(),
        timestamp: 5000,
        metadata: {name: 'meta5'},
      });

      let entries = await getObjectStoreEntries();
      expect(entries).to.have.lengthOf(5);

      const sr4a = await queueStore2.popEntry();
      expect(sr4a.requestData).to.deep.equal(sr4.toObject());
      expect(sr4a.timestamp).to.equal(4000);
      expect(sr4a.metadata).to.deep.equal({name: 'meta4'});
      // It should not return the ID or queue name.
      expect(sr4a.id).to.be.undefined;
      expect(sr4a.queueName).to.be.undefined;

      entries = await getObjectStoreEntries();
      expect(entries).to.have.lengthOf(4);
      expect(entries[0].id).to.equal(1);
      expect(entries[0].queueName).to.equal('a');
      expect(entries[0].requestData.url).to.equal('/one');
      expect(entries[1].id).to.equal(2);
      expect(entries[1].queueName).to.equal('b');
      expect(entries[1].requestData.url).to.equal('/two');
      expect(entries[2].id).to.equal(3);
      expect(entries[2].queueName).to.equal('b');
      expect(entries[2].requestData.url).to.equal('/three');
      expect(entries[3].id).to.equal(5);
      expect(entries[3].queueName).to.equal('a');
      expect(entries[3].requestData.url).to.equal('/five');

      const sr5a = await queueStore1.popEntry();
      expect(sr5a.requestData).to.deep.equal(sr5.toObject());
      expect(sr5a.timestamp).to.equal(5000);
      expect(sr5a.metadata).to.deep.equal({name: 'meta5'});
      // It should not return the ID or queue name.
      expect(sr5a.id).to.be.undefined;
      expect(sr5a.queueName).to.be.undefined;

      entries = await getObjectStoreEntries();
      expect(entries).to.have.lengthOf(3);
      expect(entries[0].id).to.equal(1);
      expect(entries[1].id).to.equal(2);
      expect(entries[2].id).to.equal(3);
    });
  });
});
