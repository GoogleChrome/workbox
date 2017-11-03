/*
 Copyright 2017 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

import {expect} from 'chai';
import clearRequire from 'clear-require';
import {reset as iDBReset} from 'shelving-mock-indexeddb';
import {DB_NAME, OBJECT_STORE_NAME} from
    '../../../../packages/workbox-background-sync/utils/constants.mjs';
import {QueueStore} from
    '../../../../packages/workbox-background-sync/models/QueueStore.mjs';
import {DBWrapper} from '../../../../packages/workbox-core/_private.mjs';
import StorableRequest from
    '../../../../packages/workbox-background-sync/models/StorableRequest.mjs';

let Queue;

const getObjectStoreEntries = async () => {
  return await new DBWrapper(DB_NAME, 1).getAll(OBJECT_STORE_NAME);
};


describe(`[workbox-background-sync] QueueStore`, function() {
  beforeEach(async function() {
    // Clear Queue so the name map gets reset on re-import.
    clearRequire('../../../../packages/workbox-background-sync/Queue.mjs');
    iDBReset();

    // Re-import Queue each time so the name map gets reset.
    const imprt = await import(
        '../../../../packages/workbox-background-sync/Queue.mjs');

    Queue = imprt.Queue;
  });

  after(async function() {
    // Clear Queue so the name map gets reset on re-import.
    clearRequire('../../../../packages/workbox-background-sync/Queue.mjs');
    iDBReset();
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
