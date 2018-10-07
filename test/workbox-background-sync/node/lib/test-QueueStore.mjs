/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {expect} from 'chai';
import {reset as iDBReset} from 'shelving-mock-indexeddb';
import {DB_NAME, OBJECT_STORE_NAME} from
  '../../../../packages/workbox-background-sync/utils/constants.mjs';
import {Queue} from
  '../../../../packages/workbox-background-sync/Queue.mjs';
import {QueueStore} from
  '../../../../packages/workbox-background-sync/models/QueueStore.mjs';
import {DBWrapper} from
  '../../../../packages/workbox-core/_private/DBWrapper.mjs';
import StorableRequest from
  '../../../../packages/workbox-background-sync/models/StorableRequest.mjs';

const getObjectStoreEntries = async () => {
  return await new DBWrapper(DB_NAME, 1).getAll(OBJECT_STORE_NAME);
};

describe(`[workbox-background-sync] QueueStore`, function() {
  const reset = () => {
    Queue._queueNames.clear();
    iDBReset();
  };

  beforeEach(function() {
    reset();
  });

  after(async function() {
    reset();
  });

  describe(`constructor`, function() {
    it(`should associate the queue store with a Queue instance`, function() {
      const queue = new Queue('foo');
      const queueStore = new QueueStore(queue);

      expect(queueStore._queue).to.equal(queue);
    });
  });

  describe(`addEntry`, function() {
    it(`should add a StorableRequest to an IDB object store with the ` +
        `right queue name`, async function() {
      const queue = new Queue('foo');
      const queueStore = new QueueStore(queue);

      const sr1 = await StorableRequest.fromRequest(new Request('/one'));
      const sr2 = await StorableRequest.fromRequest(new Request('/two'));

      await queueStore.addEntry(sr1);
      await queueStore.addEntry(sr2);

      const entries = await getObjectStoreEntries();

      expect(entries).to.have.lengthOf(2);
      expect(entries[0].queueName).to.equal('foo');
      expect(entries[0].storableRequest.url).to.equal('/one');
      expect(entries[1].queueName).to.equal('foo');
      expect(entries[1].storableRequest.url).to.equal('/two');
    });
  });

  describe(`getAndRemoveOldestEntry`, function() {
    it(`should remove the first entry added to the store`, async function() {
      const queue = new Queue('foo');
      const queueStore = new QueueStore(queue);

      const sr1 = await StorableRequest.fromRequest(new Request('/one'));
      const sr2 = await StorableRequest.fromRequest(new Request('/two'));

      await queueStore.addEntry(sr1);
      await queueStore.addEntry(sr2);

      let entries = await getObjectStoreEntries();
      expect(entries).to.have.lengthOf(2);

      const sr3 = await queueStore.getAndRemoveOldestEntry();
      expect(sr3.url).to.equal('/one');

      entries = await getObjectStoreEntries();
      expect(entries).to.have.lengthOf(1);
      expect(entries[0].queueName).to.equal('foo');
      expect(entries[0].storableRequest.url).to.equal('/two');
    });

    it(`should return undefined when no entries exist`, async function() {
      const queue = new Queue('foo');
      const queueStore = new QueueStore(queue);

      const sr1 = await StorableRequest.fromRequest(new Request('/one'));
      const sr2 = await StorableRequest.fromRequest(new Request('/two'));

      await queueStore.addEntry(sr1);
      await queueStore.addEntry(sr2);

      let entries = await getObjectStoreEntries();
      expect(entries).to.have.lengthOf(2);

      const sr3 = await queueStore.getAndRemoveOldestEntry();
      const sr4 = await queueStore.getAndRemoveOldestEntry();
      expect(sr3.url).to.equal('/one');
      expect(sr4.url).to.equal('/two');

      // No more entries should exist.
      expect(await queueStore.getAndRemoveOldestEntry()).to.be.undefined;
    });
  });
});
