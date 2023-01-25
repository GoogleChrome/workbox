/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {QueueStore} from 'workbox-background-sync/lib/QueueStore.mjs';
import {StorableRequest} from 'workbox-background-sync/lib/StorableRequest.mjs';
import {QueueDb} from 'workbox-background-sync/lib/QueueDb.mjs';
import {openDB} from 'idb';

describe(`QueueStore`, function () {
  let db = null;

  beforeEach(async function () {
    db = await openDB('workbox-background-sync', 3, {
      upgrade: QueueDb.prototype._upgradeDb,
    });
    await db.clear('requests');
  });

  describe(`constructor`, function () {
    it(`should associate the queue name with a Queue instance`, function () {
      const queueStore = new QueueStore('foo');
      expect(queueStore._queueName).to.equal('foo');
    });
  });

  describe(`pushEntry`, function () {
    it(`should append an entry to IDB with the right queue name`, async function () {
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

      let entries = await db.getAll('requests');
      const firstId = entries[0].id;

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

      entries = await db.getAll('requests');
      expect(entries).to.have.lengthOf(5);
      expect(entries[0].id).to.equal(firstId);
      expect(entries[0].queueName).to.equal('a');
      expect(entries[0].requestData.url).to.equal(`${location.origin}/one`);
      expect(entries[0].timestamp).to.equal(1000);
      expect(entries[0].metadata).to.deep.equal({name: 'meta1'});
      expect(entries[1].id).to.equal(firstId + 1);
      expect(entries[1].queueName).to.equal('b');
      expect(entries[1].requestData.url).to.equal(`${location.origin}/two`);
      expect(entries[1].timestamp).to.equal(2000);
      expect(entries[1].metadata).to.deep.equal({name: 'meta2'});
      expect(entries[2].id).to.equal(firstId + 2);
      expect(entries[2].queueName).to.equal('b');
      expect(entries[2].requestData.url).to.equal(`${location.origin}/three`);
      expect(entries[2].timestamp).to.equal(3000);
      expect(entries[2].metadata).to.deep.equal({name: 'meta3'});
      expect(entries[3].id).to.equal(firstId + 3);
      expect(entries[3].queueName).to.equal('b');
      expect(entries[3].requestData.url).to.equal(`${location.origin}/four`);
      expect(entries[3].timestamp).to.equal(4000);
      expect(entries[3].metadata).to.deep.equal({name: 'meta4'});
      expect(entries[4].id).to.equal(firstId + 4);
      expect(entries[4].queueName).to.equal('a');
      expect(entries[4].requestData.url).to.equal(`${location.origin}/five`);
      expect(entries[4].timestamp).to.equal(5000);
      expect(entries[4].metadata).to.deep.equal({name: 'meta5'});
    });

    it(`throws if not given an entry object`, function () {
      if (process.env.NODE_ENV === 'production') this.skip();

      return expectError(async () => {
        const queueStore = new QueueStore('a');
        await queueStore.pushEntry();
      }, 'incorrect-type');
    });

    it(`throws if not given an entry object with requestData`, function () {
      if (process.env.NODE_ENV === 'production') this.skip();

      return expectError(async () => {
        const queueStore = new QueueStore('a');
        await queueStore.pushEntry({});
      }, 'incorrect-type');
    });
  });

  describe(`unshiftEntry`, function () {
    it(`should prepend an entry to IDB with the right queue name and ID`, async function () {
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

      let entries = await db.getAll('requests');
      const firstId = entries[0].id;

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

      entries = await db.getAll('requests');
      expect(entries).to.have.lengthOf(5);
      expect(entries[0].id).to.equal(firstId - 4);
      expect(entries[0].timestamp).to.equal(5000);
      expect(entries[0].metadata).to.deep.equal({name: 'meta5'});
      expect(entries[0].queueName).to.equal('a');
      expect(entries[0].requestData.url).to.equal(`${location.origin}/five`);
      expect(entries[1].id).to.equal(firstId - 3);
      expect(entries[1].timestamp).to.equal(4000);
      expect(entries[1].metadata).to.deep.equal({name: 'meta4'});
      expect(entries[1].queueName).to.equal('b');
      expect(entries[1].requestData.url).to.equal(`${location.origin}/four`);
      expect(entries[2].id).to.equal(firstId - 2);
      expect(entries[2].timestamp).to.equal(3000);
      expect(entries[2].metadata).to.deep.equal({name: 'meta3'});
      expect(entries[2].queueName).to.equal('b');
      expect(entries[2].requestData.url).to.equal(`${location.origin}/three`);
      expect(entries[3].id).to.equal(firstId - 1);
      expect(entries[3].timestamp).to.equal(2000);
      expect(entries[3].metadata).to.deep.equal({name: 'meta2'});
      expect(entries[3].queueName).to.equal('b');
      expect(entries[3].requestData.url).to.equal(`${location.origin}/two`);
      expect(entries[4].id).to.equal(firstId);
      expect(entries[4].timestamp).to.equal(1000);
      expect(entries[4].metadata).to.deep.equal({name: 'meta1'});
      expect(entries[4].queueName).to.equal('a');
      expect(entries[4].requestData.url).to.equal(`${location.origin}/one`);
    });

    it(`throws if not given an entry object`, function () {
      if (process.env.NODE_ENV === 'production') this.skip();

      return expectError(async () => {
        const queueStore = new QueueStore('a');
        await queueStore.unshiftEntry();
      }, 'incorrect-type');
    });

    it(`throws if not given an entry object with requestData`, function () {
      if (process.env.NODE_ENV === 'production') this.skip();

      return expectError(async () => {
        const queueStore = new QueueStore('a');
        await queueStore.unshiftEntry({});
      }, 'incorrect-type');
    });
  });

  describe(`shiftEntry`, function () {
    it(`should remove and return the first entry in IDB with the matching queue name`, async function () {
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

      let entries = await db.getAll('requests');
      const firstId = entries[0].id;

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

      entries = await db.getAll('requests');
      expect(entries).to.have.lengthOf(5);

      const sr2a = await queueStore2.shiftEntry();
      expect(sr2a.requestData).to.deep.equal(sr2.toObject());
      expect(sr2a.timestamp).to.equal(2000);
      expect(sr2a.metadata).to.deep.equal({name: 'meta2'});
      expect(sr2a.id).to.equal(firstId + 1);
      expect(sr2a.queueName).to.equal('b');

      entries = await db.getAll('requests');
      expect(entries).to.have.lengthOf(4);
      expect(entries[0].id).to.equal(firstId);
      expect(entries[1].id).to.equal(firstId + 2);
      expect(entries[2].id).to.equal(firstId + 3);
      expect(entries[3].id).to.equal(firstId + 4);

      const sr1a = await queueStore1.shiftEntry();
      expect(sr1a.requestData).to.deep.equal(sr1.toObject());
      expect(sr1a.timestamp).to.equal(1000);
      expect(sr1a.metadata).to.deep.equal({name: 'meta1'});
      expect(sr1a.id).to.equal(firstId);
      expect(sr1a.queueName).to.equal('a');

      entries = await db.getAll('requests');
      expect(entries).to.have.lengthOf(3);
      expect(entries[0].id).to.equal(firstId + 2);
      expect(entries[1].id).to.equal(firstId + 3);
      expect(entries[2].id).to.equal(firstId + 4);
    });
  });

  describe(`popEntry`, function () {
    it(`should remove and return the last entry in IDB with the matching queue name`, async function () {
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

      let entries = await db.getAll('requests');
      const firstId = entries[0].id;

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

      entries = await db.getAll('requests');
      expect(entries).to.have.lengthOf(5);

      const sr4a = await queueStore2.popEntry();
      expect(sr4a.requestData).to.deep.equal(sr4.toObject());
      expect(sr4a.timestamp).to.equal(4000);
      expect(sr4a.metadata).to.deep.equal({name: 'meta4'});
      expect(sr4a.id).to.equal(firstId + 3);
      expect(sr4a.queueName).to.equal('b');

      entries = await db.getAll('requests');
      expect(entries).to.have.lengthOf(4);
      expect(entries[0].id).to.equal(firstId);
      expect(entries[0].queueName).to.equal('a');
      expect(entries[0].requestData.url).to.equal(`${location.origin}/one`);
      expect(entries[1].id).to.equal(firstId + 1);
      expect(entries[1].queueName).to.equal('b');
      expect(entries[1].requestData.url).to.equal(`${location.origin}/two`);
      expect(entries[2].id).to.equal(firstId + 2);
      expect(entries[2].queueName).to.equal('b');
      expect(entries[2].requestData.url).to.equal(`${location.origin}/three`);
      expect(entries[3].id).to.equal(firstId + 4);
      expect(entries[3].queueName).to.equal('a');
      expect(entries[3].requestData.url).to.equal(`${location.origin}/five`);

      const sr5a = await queueStore1.popEntry();
      expect(sr5a.requestData).to.deep.equal(sr5.toObject());
      expect(sr5a.timestamp).to.equal(5000);
      expect(sr5a.metadata).to.deep.equal({name: 'meta5'});
      expect(sr5a.id).to.equal(firstId + 4);
      expect(sr5a.queueName).to.equal('a');

      entries = await db.getAll('requests');
      expect(entries).to.have.lengthOf(3);
      expect(entries[0].id).to.equal(firstId);
      expect(entries[1].id).to.equal(firstId + 1);
      expect(entries[2].id).to.equal(firstId + 2);
    });
  });

  describe(`getAll`, function () {
    it(`should return all entries in IDB with the right queue name`, async function () {
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

      const entries = await db.getAll('requests');
      const firstId = entries[0].id;

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

      expect(await queueStore1.getAll()).to.deep.equal([
        {
          id: firstId,
          queueName: 'a',
          requestData: sr1.toObject(),
          timestamp: 1000,
          metadata: {name: 'meta1'},
        },
        {
          id: firstId + 4,
          queueName: 'a',
          requestData: sr5.toObject(),
          timestamp: 5000,
          metadata: {name: 'meta5'},
        },
      ]);

      expect(await queueStore2.getAll()).to.deep.equal([
        {
          id: firstId + 1,
          queueName: 'b',
          requestData: sr2.toObject(),
          timestamp: 2000,
          metadata: {name: 'meta2'},
        },
        {
          id: firstId + 2,
          queueName: 'b',
          requestData: sr3.toObject(),
          timestamp: 3000,
          metadata: {name: 'meta3'},
        },
        {
          id: firstId + 3,
          queueName: 'b',
          requestData: sr4.toObject(),
          timestamp: 4000,
          metadata: {name: 'meta4'},
        },
      ]);

      await db.clear('requests');

      expect(await queueStore1.getAll()).to.deep.equal([]);
      expect(await queueStore2.getAll()).to.deep.equal([]);
    });
  });

  describe(`size`, function () {
    it(`should return the number of entries in IDB with the right queue name`, async function () {
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

      expect(await queueStore1.size()).to.equal(2);
      expect(await queueStore2.size()).to.equal(3);

      await db.clear('requests');

      expect(await queueStore1.size()).to.deep.equal(0);
      expect(await queueStore2.size()).to.deep.equal(0);
    });
  });

  describe(`delete`, function () {
    it(`should delete an entry for the given ID`, async function () {
      const queueStore = new QueueStore('a');

      const sr1 = await StorableRequest.fromRequest(new Request('/one'));
      const sr2 = await StorableRequest.fromRequest(new Request('/two'));
      const sr3 = await StorableRequest.fromRequest(new Request('/three'));

      await queueStore.pushEntry({
        requestData: sr1.toObject(),
        timestamp: 1000,
        metadata: {name: 'meta1'},
      });

      const entries = await db.getAll('requests');
      const firstId = entries[0].id;

      await queueStore.pushEntry({
        requestData: sr2.toObject(),
        timestamp: 2000,
        metadata: {name: 'meta2'},
      });
      await queueStore.pushEntry({
        requestData: sr3.toObject(),
        timestamp: 3000,
        metadata: {name: 'meta3'},
      });

      await queueStore.deleteEntry(firstId + 1);

      expect(await db.getAll('requests')).to.deep.equal([
        {
          id: firstId,
          queueName: 'a',
          requestData: sr1.toObject(),
          timestamp: 1000,
          metadata: {name: 'meta1'},
        },
        {
          id: firstId + 2,
          queueName: 'a',
          requestData: sr3.toObject(),
          timestamp: 3000,
          metadata: {name: 'meta3'},
        },
      ]);
    });
  });
});
