/*
  Copyright 2021 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {QueueDb} from 'workbox-background-sync/lib/QueueDb.mjs';
import {openDB, deleteDB} from 'idb';

describe(`QueueDb`, () => {
  let db = null;

  const requestData1 = {
    url: `${location.origin}/one`,
    requestInit: {
      mode: 'cors',
    },
  };

  const requestData2 = {
    url: `${location.origin}/two`,
    requestInit: {
      mode: 'cors',
    },
  };

  const requestData3 = {
    url: `${location.origin}/three`,
    requestInit: {
      mode: 'cors',
    },
  };

  const requestData4 = {
    url: `${location.origin}/four`,
    requestInit: {
      mode: 'cors',
    },
  };

  const requestData5 = {
    url: `${location.origin}/five`,
    requestInit: {
      mode: 'cors',
    },
  };

  const entry1 = {
    queueName: 'a',
    requestData: requestData1,
    timestamp: 1000,
    metadata: {name: 'meta1'},
  };

  const entry2 = {
    queueName: 'a',
    requestData: requestData2,
    timestamp: 2000,
    metadata: {name: 'meta2'},
  };

  const entry3 = {
    queueName: 'a',
    requestData: requestData3,
    timestamp: 3000,
    metadata: {name: 'meta3'},
  };

  const entry4 = {
    queueName: 'b',
    requestData: requestData4,
    timestamp: 4000,
    metadata: {name: 'meta4'},
  };

  const entry5 = {
    queueName: 'b',
    requestData: requestData5,
    timestamp: 5000,
    metadata: {name: 'meta5'},
  };

  beforeEach(async () => {
    db = await openDB('workbox-background-sync', 3, {
      upgrade: QueueDb.prototype._upgradeDb,
    });
    await db.clear('requests');
  });

  describe(`_upgradeDb`, () => {
    const v3Entry = {
      queueName: 'a',
      metadata: {
        one: '1',
        two: '2',
      },
      timestamp: 123,
      requestData: {
        url: `${location.origin}/one`,
        requestInit: {
          mode: 'cors',
        },
      },
    };

    it(`should handle upgrading from no previous version`, async () => {
      const dbv3 = await openDB('workbox-background-sync-from-v3', 3, {
        upgrade: QueueDb.prototype._upgradeDb,
      });

      let entries = await dbv3.getAll('requests');
      expect(entries.length).to.equal(0);

      await dbv3.add('requests', v3Entry);

      entries = await dbv3.getAll('requests');
      expect(entries[0].id).to.equal(1);
      expect(entries[0].timestamp).to.equal(v3Entry.timestamp);
      expect(entries[0].metadata).to.deep.equal(v3Entry.metadata);
      expect(entries[0].queueName).to.equal(v3Entry.queueName);
      expect(entries[0].requestData).to.deep.equal(v3Entry.requestData);

      await deleteDB('workbox-background-sync-from-v3', {
        blocked() {
          dbv3.close();
        },
      });
    });

    it(`should handle upgrading from version 1`, async () => {
      await deleteDB('workbox-background-sync-from-v1');

      const dbv1 = await openDB('workbox-background-sync-from-v1', 1, {
        upgrade(db) {
          db.createObjectStore('requests', {
            autoIncrement: true,
          }).createIndex('queueName', 'queueName', {unique: false});
        },
      });

      // Add entries in v1 format.
      await dbv1.add('requests', {
        queueName: 'a',
        storableRequest: {
          url: `${location.origin}/one`,
          timestamp: 123,
          requestInit: {
            method: 'POST',
            mode: 'cors',
            headers: {
              'x-foo': 'bar',
              'x-qux': 'baz',
            },
          },
        },
      });
      await dbv1.add('requests', {
        queueName: 'b',
        storableRequest: {
          url: `${location.origin}/two`,
          timestamp: 234,
          requestInit: {
            mode: 'cors',
          },
        },
      });
      await dbv1.add('requests', {
        queueName: 'a',
        storableRequest: {
          url: `${location.origin}/three`,
          timestamp: 345,
          requestInit: {},
        },
      });

      const dbv3 = await openDB('workbox-background-sync-from-v1', 3, {
        upgrade: QueueDb.prototype._upgradeDb,
        blocked() {
          dbv1.close();
        },
      });

      let entries = await dbv3.getAll('requests');
      expect(entries.length).to.equal(0);

      await dbv3.add('requests', v3Entry);

      entries = await dbv3.getAll('requests');
      expect(entries[0].id).to.equal(1);
      expect(entries[0].timestamp).to.equal(v3Entry.timestamp);
      expect(entries[0].metadata).to.deep.equal(v3Entry.metadata);
      expect(entries[0].queueName).to.equal(v3Entry.queueName);
      expect(entries[0].requestData).to.deep.equal(v3Entry.requestData);

      await deleteDB('workbox-background-sync-from-v1', {
        blocked() {
          dbv3.close();
        },
      });
    });

    it(`should handle upgrading from version 2`, async () => {
      await deleteDB('workbox-background-sync-from-v2');

      const dbv2 = await openDB('workbox-background-sync-from-v2', 2, {
        upgrade(db) {
          db.createObjectStore('requests', {
            autoIncrement: true,
            keyPath: 'id',
          }).createIndex('queueName', 'queueName', {unique: false});
        },
      });

      // Add entries in v2 format.
      await dbv2.add('requests', {
        queueName: 'a',
        metadata: {one: '1', two: '2'},
        storableRequest: {
          url: `${location.origin}/one`,
          timestamp: 123,
          requestInit: {
            method: 'POST',
            mode: 'cors',
            headers: {
              'x-foo': 'bar',
              'x-qux': 'baz',
            },
          },
        },
      });
      await dbv2.add('requests', {
        queueName: 'b',
        metadata: {three: '3', four: '4'},
        storableRequest: {
          url: `${location.origin}/two`,
          timestamp: 234,
          requestInit: {
            mode: 'cors',
          },
        },
      });

      const dbv3 = await openDB('workbox-background-sync-from-v2', 3, {
        upgrade: QueueDb.prototype._upgradeDb,
        blocked() {
          dbv2.close();
        },
      });

      let entries = await dbv3.getAll('requests');
      expect(entries.length).to.equal(0);

      await dbv3.add('requests', v3Entry);

      entries = await dbv3.getAll('requests');
      expect(entries[0].id).to.equal(1);
      expect(entries[0].timestamp).to.equal(v3Entry.timestamp);
      expect(entries[0].metadata).to.deep.equal(v3Entry.metadata);
      expect(entries[0].queueName).to.equal(v3Entry.queueName);
      expect(entries[0].requestData).to.deep.equal(v3Entry.requestData);

      await deleteDB('workbox-background-sync-from-v2', {
        blocked() {
          dbv3.close();
        },
      });
    });
  });

  describe('getFirstEntryId', () => {
    it(`should return the first entry id in the IBDObjectStore`, async () => {
      const queueDb = new QueueDb();

      await queueDb.addEntry(entry1);

      const entries = await db.getAll('requests');
      const firstId = entries[0].id;

      await queueDb.addEntry(entry2);
      await queueDb.addEntry(entry3);

      const result = await queueDb.getFirstEntryId();
      expect(result).to.equal(firstId);
    });
  });

  describe('getAllEntriesByQueueName', () => {
    it(`should return all entries in IDB filtered by index`, async () => {
      const queueDb = new QueueDb();

      await queueDb.addEntry(entry1);

      const entries = await db.getAll('requests');
      const firstId = entries[0].id;

      await queueDb.addEntry(entry2);
      await queueDb.addEntry(entry3);
      await queueDb.addEntry(entry4);
      await queueDb.addEntry(entry5);

      let results = await queueDb.getAllEntriesByQueueName('b');
      expect(results).to.deep.equal([
        {
          id: firstId + 3,
          queueName: 'b',
          requestData: requestData4,
          timestamp: 4000,
          metadata: {name: 'meta4'},
        },
        {
          id: firstId + 4,
          queueName: 'b',
          requestData: requestData5,
          timestamp: 5000,
          metadata: {name: 'meta5'},
        },
      ]);

      results = await queueDb.getAllEntriesByQueueName('a');
      expect(results).to.deep.equal([
        {
          id: firstId,
          queueName: 'a',
          requestData: requestData1,
          timestamp: 1000,
          metadata: {name: 'meta1'},
        },
        {
          id: firstId + 1,
          queueName: 'a',
          requestData: requestData2,
          timestamp: 2000,
          metadata: {name: 'meta2'},
        },
        {
          id: firstId + 2,
          queueName: 'a',
          requestData: requestData3,
          timestamp: 3000,
          metadata: {name: 'meta3'},
        },
      ]);

      await db.clear('requests');

      expect(await queueDb.getAllEntriesByQueueName('a')).to.deep.equal([]);
      expect(await queueDb.getAllEntriesByQueueName('b')).to.deep.equal([]);
    });
  });

  describe('getEntryCountByQueueName', () => {
    it(`should return the number of entries in IDB filtered by index`, async () => {
      const queueDb = new QueueDb();

      await queueDb.addEntry(entry1);
      await queueDb.addEntry(entry2);
      await queueDb.addEntry(entry3);
      await queueDb.addEntry(entry4);
      await queueDb.addEntry(entry5);

      expect(await queueDb.getEntryCountByQueueName('a')).to.equal(3);
      expect(await queueDb.getEntryCountByQueueName('b')).to.equal(2);

      await db.clear('requests');

      expect(await queueDb.getEntryCountByQueueName('a')).to.equal(0);
      expect(await queueDb.getEntryCountByQueueName('b')).to.equal(0);
    });
  });

  describe('deleteEntry', () => {
    it(`should delete an entry for the given ID`, async () => {
      const queueDb = new QueueDb();

      await queueDb.addEntry(entry1);

      const entries = await db.getAll('requests');
      const firstId = entries[0].id;

      await queueDb.addEntry(entry2);
      await queueDb.addEntry(entry3);

      await queueDb.deleteEntry(firstId + 1);

      expect(await db.getAll('requests')).to.deep.equal([
        {
          id: firstId,
          queueName: 'a',
          requestData: requestData1,
          timestamp: 1000,
          metadata: {name: 'meta1'},
        },
        {
          id: firstId + 2,
          queueName: 'a',
          requestData: requestData3,
          timestamp: 3000,
          metadata: {name: 'meta3'},
        },
      ]);
    });
  });

  describe('deleteEntry', () => {
    it(`should delete an entry for the given ID`, async () => {
      const queueDb = new QueueDb();

      await queueDb.addEntry(entry1);

      const entries = await db.getAll('requests');
      const firstId = entries[0].id;

      await queueDb.addEntry(entry2);
      await queueDb.addEntry(entry3);

      await queueDb.deleteEntry(firstId + 1);

      expect(await db.getAll('requests')).to.deep.equal([
        {
          id: firstId,
          queueName: 'a',
          requestData: requestData1,
          timestamp: 1000,
          metadata: {name: 'meta1'},
        },
        {
          id: firstId + 2,
          queueName: 'a',
          requestData: requestData3,
          timestamp: 3000,
          metadata: {name: 'meta3'},
        },
      ]);
    });
  });

  describe('addEntry', () => {
    it(`Should add new entries`, async () => {
      const queueDb = new QueueDb();

      await queueDb.addEntry(entry1);

      const entries = await db.getAll('requests');
      const firstId = entries[0].id;

      await queueDb.addEntry(entry3);

      expect(await db.getAll('requests')).to.deep.equal([
        {
          id: firstId,
          queueName: 'a',
          requestData: requestData1,
          timestamp: 1000,
          metadata: {name: 'meta1'},
        },
        {
          id: firstId + 1,
          queueName: 'a',
          requestData: requestData3,
          timestamp: 3000,
          metadata: {name: 'meta3'},
        },
      ]);
    });
  });

  describe('getFirstEntryByQueueName', () => {
    it(`should return first entry in IDB filtered by index`, async () => {
      const queueDb = new QueueDb();

      await queueDb.addEntry(entry1);

      const entries = await db.getAll('requests');
      const firstId = entries[0].id;

      await queueDb.addEntry(entry2);
      await queueDb.addEntry(entry3);
      await queueDb.addEntry(entry4);
      await queueDb.addEntry(entry5);

      let result = await queueDb.getFirstEntryByQueueName('b');
      expect(result).to.deep.equal({
        id: firstId + 3,
        queueName: 'b',
        requestData: requestData4,
        timestamp: 4000,
        metadata: {name: 'meta4'},
      });

      result = await queueDb.getFirstEntryByQueueName('a');
      expect(result).to.deep.equal({
        id: firstId,
        queueName: 'a',
        requestData: requestData1,
        timestamp: 1000,
        metadata: {name: 'meta1'},
      });
    });
  });

  describe('getLastEntryByQueueName', () => {
    it(`should return last entry in IDB filtered by index`, async () => {
      const queueDb = new QueueDb();

      await queueDb.addEntry(entry1);

      const entries = await db.getAll('requests');
      const firstId = entries[0].id;

      await queueDb.addEntry(entry2);
      await queueDb.addEntry(entry3);
      await queueDb.addEntry(entry4);
      await queueDb.addEntry(entry5);

      let result = await queueDb.getLastEntryByQueueName('b');
      expect(result).to.deep.equal({
        id: firstId + 4,
        queueName: 'b',
        requestData: requestData5,
        timestamp: 5000,
        metadata: {name: 'meta5'},
      });

      result = await queueDb.getLastEntryByQueueName('a');
      expect(result).to.deep.equal({
        id: firstId + 2,
        queueName: 'a',
        requestData: requestData3,
        timestamp: 3000,
        metadata: {name: 'meta3'},
      });
    });
  });
});
