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
import sinon from 'sinon';
import expectError from '../../../../infra/utils/expectError';
import indexedDBHelper, {DBWrapper} from
    '../../../../packages/workbox-core/utils/indexedDBHelper.mjs';


let Queue;

/**
 * Suspends execution in an async function for the specified amount of time.
 *
 * @param {number} time
 * @return {Promise}
 */
const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));

/**
 * Invokes a test function until it returns true.

 * @param {Function}
 * @return {Promise}
 */
const waitUntil = async (test) => {
  if (test() === true) {
    return Promise.resolve();
  } else {
    await sleep(100);
    return waitUntil(test);
  }
};


const clearObjectStore = async () => {
  const db = await indexedDBHelper.getDB(
      'workbox-background-sync', 'requests', {autoIncrement: true});

  const items = await db.getAll();
  for (const [key] of items.entries()) {
    await db.delete(key);
  }
};


describe(`backgroundSync.Queue`, function() {
  const sandbox = sinon.sandbox.create();

  beforeEach(async function() {
    sandbox.restore();
    clearRequire.match(RegExp('workbox-background-sync/lib/Queue.mjs'));

    clearObjectStore();

    // Remove any lingering event listeners
    global.__removeAllEventListeners();

    // Re-import Queue each time so the name map gets reset.
    const imprt = await import(
        '../../../../packages/workbox-background-sync/lib/Queue.mjs');

    Queue = imprt.default;
  });

  after(async function() {
    sandbox.restore();
    clearRequire.match(RegExp('workbox-background-sync/lib/Queue.mjs'));

    clearObjectStore();

    // Remove any lingering event listeners
    global.__removeAllEventListeners();
  });

  describe(`constructor`, function() {
    it(`should throw if two queues are created with the same name`,
        async function() {
      expect(() => {
        new Queue('foo');
        new Queue('bar');
      }).not.to.throw();

      await expectError(() => {
        new Queue('foo');
      }, 'duplicate-queue-name');

      expect(() => {
        new Queue('baz');
      }).not.to.throw();
    });

    it(`should add a sync event listener that replays the queue when the ` +
        `event is dispatched`, async function() {
      sandbox.spy(self, 'addEventListener');
      sandbox.spy(Queue.prototype, 'replayRequests');

      new Queue('foo');

      expect(self.addEventListener.calledOnce).to.be.true;
      expect(self.addEventListener.calledWith('sync')).to.be.true;

      self.dispatchEvent(new SyncEvent('sync', {
        tag: 'workbox-background-sync:foo',
      }));

      expect(Queue.prototype.replayRequests.calledOnce).to.be.true;
    });
  });

  describe(`addRequest`, function() {
    it(`should serialize the request and store it in IndexedDB`,
        async function() {
      sandbox.spy(DBWrapper.prototype, 'add');
      sandbox.stub(self.registration, 'active').value({});

      const queue = new Queue('foo');
      const requestUrl = 'https://example.com';
      const requestData = {
        method: 'POST',
        body: 'testing...',
        headers: {'x-foo': 'bar'},
        mode: 'cors',
      };
      const request = new Request(requestUrl, requestData);

      await queue.addRequest(request);

      expect(DBWrapper.prototype.add.calledOnce).to.be.true;
      expect(DBWrapper.prototype.add.calledWith({
        queueName: 'foo',
        url: requestUrl,
        timestamp: sinon.match.number,
        requestData: sinon.match(requestData),
      })).to.be.true;
    });

    it(`should register to receive sync events for a unique tag`,
        async function() {
      sandbox.stub(self.registration, 'active').value({});
      sandbox.stub(self.registration, 'sync').value({
        register: sinon.stub().resolves(),
      });

      const queue = new Queue('foo');
      const requestUrl = 'https://example.com';
      const requestData = {
        method: 'POST',
        body: 'testing...',
        headers: {'x-foo': 'bar'},
        mode: 'cors',
      };
      const request = new Request(requestUrl, requestData);

      await queue.addRequest(request);

      expect(self.registration.sync.register.calledOnce).to.be.true;
      expect(self.registration.sync.register.calledWith(
          'workbox-background-sync:foo')).to.be.true;
    });

    it(`should delay registration until the SW is active`, async function() {
      sandbox.stub(self.registration, 'active').value(undefined);
      sandbox.stub(self.registration, 'sync').value({
        register: sinon.stub().resolves(),
      });

      const queue = new Queue('foo');
      const requestUrl = 'https://example.com';
      const requestData = {
        method: 'POST',
        body: 'testing...',
        headers: {'x-foo': 'bar'},
        mode: 'cors',
      };
      const request = new Request(requestUrl, requestData);

      // This shouldn't error, even though activation hasn't happened yet.
      await queue.addRequest(request);

      // Allow time to ensure async registration didn't happen.
      await sleep(100);
      expect(self.registration.sync.register.calledOnce).to.be.false;

      self.dispatchEvent(new ExtendableEvent('activate'));

      // Allow time to let registration happen async.
      await sleep(100);
      expect(self.registration.sync.register.calledWith(
          'workbox-background-sync:foo')).to.be.true;
    });
  });

  describe(`replayRequests`, function() {
    it(`should try to re-fetch all requests in the queue`, async function() {
      sandbox.spy(self, 'fetch');

      const queue1 = new Queue('foo');
      const queue2 = new Queue('bar');

      // Add requests for both queues to ensure only the requests from
      // the matching queue are replayed.
      await queue1.addRequest(new Request('/one'));
      await queue2.addRequest(new Request('/two'));
      await queue1.addRequest(new Request('/three'));
      await queue2.addRequest(new Request('/four'));
      await queue1.addRequest(new Request('/five'));

      queue1.replayRequests();

      // Wait until the requests have been replayed.
      await waitUntil(() => self.fetch.callCount == 3);

      expect(self.fetch.getCall(0).calledWith(sinon.match({
        url: '/one',
      }))).to.be.true;

      expect(self.fetch.getCall(1).calledWith(sinon.match({
        url: '/three',
      }))).to.be.true;

      expect(self.fetch.getCall(2).calledWith(sinon.match({
        url: '/five',
      }))).to.be.true;

      queue2.replayRequests();

      // Wait until the requests have been replayed.
      await waitUntil(() => self.fetch.callCount == 5);

      expect(self.fetch.getCall(3).calledWith(sinon.match({
        url: '/two',
      }))).to.be.true;

      expect(self.fetch.getCall(4).calledWith(sinon.match({
        url: '/four',
      }))).to.be.true;
    });

    it(`should remove requests after a successful retry`, async function() {
      sandbox.spy(self, 'fetch');

      const queue1 = new Queue('foo');
      const queue2 = new Queue('bar');

      // Add requests for both queues to ensure only the requests from
      // the matching queue are replayed.
      await queue1.addRequest(new Request('/one'));
      await queue2.addRequest(new Request('/two'));
      await queue1.addRequest(new Request('/three'));
      await queue2.addRequest(new Request('/four'));
      await queue1.addRequest(new Request('/five'));

      queue1.replayRequests();

      // Wait until the requests have been replayed.
      await waitUntil(() => self.fetch.callCount == 3);

      const db = await indexedDBHelper.getDB(
          'workbox-background-sync', 'requests', {autoIncrement: true});

      const itemsInObjectStore = [...await db.getAll()]
          .map(([key, value]) => value.url);

      expect(itemsInObjectStore.length).to.equal(2);
      expect(itemsInObjectStore[0]).to.equal('/two');
      expect(itemsInObjectStore[1]).to.equal('/four');
    });

    it(`should keep a request in the queue if re-fetching fails`,
        async function() {
      sandbox.stub(self, 'fetch')
          .onCall(1).rejects()
          .onCall(3).rejects();

      const queue = new Queue('foo');

      // Add requests for both queues to ensure only the requests from
      // the matching queue are replayed.
      await queue.addRequest(new Request('/one'));
      await queue.addRequest(new Request('/two'));
      await queue.addRequest(new Request('/three'));
      await queue.addRequest(new Request('/four'));
      await queue.addRequest(new Request('/five'));

      queue.replayRequests(); // The second request should fail.

      // Wait until the requests have been replayed.
      await waitUntil(() => self.fetch.callCount == 5);

      const db = await indexedDBHelper.getDB(
          'workbox-background-sync', 'requests', {autoIncrement: true});

      const itemsInObjectStore = [...await db.getAll()]
          .map(([key, value]) => value.url);

      expect(itemsInObjectStore.length).to.equal(2);
      expect(itemsInObjectStore[0]).to.equal('/two');
      expect(itemsInObjectStore[1]).to.equal('/four');
    });
  });
});
