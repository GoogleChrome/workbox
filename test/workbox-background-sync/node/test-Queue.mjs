/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {expect} from 'chai';
import {reset as iDBReset} from 'shelving-mock-indexeddb';
import sinon from 'sinon';
import expectError from '../../../infra/testing/expectError';
import {Queue} from '../../../packages/workbox-background-sync/Queue.mjs';
import {QueueStore} from
  '../../../packages/workbox-background-sync/models/QueueStore.mjs';
import {DB_NAME, DB_VERSION, OBJECT_STORE_NAME} from
  '../../../packages/workbox-background-sync/utils/constants.mjs';
import {DBWrapper} from '../../../packages/workbox-core/_private/DBWrapper.mjs';
import {resetEventListeners} from
  '../../../infra/testing/sw-env-mocks/event-listeners.js';

const MINUTES = 60 * 1000;

const getObjectStoreEntries = async () => {
  return await new DBWrapper(DB_NAME, DB_VERSION).getAll(OBJECT_STORE_NAME);
};

describe(`[workbox-background-sync] Queue`, function() {
  const sandbox = sinon.createSandbox();

  const reset = () => {
    sandbox.restore();
    Queue._queueNames.clear();
    iDBReset();
    resetEventListeners();
  };

  beforeEach(async function() {
    reset();
  });

  after(async function() {
    reset();
  });

  describe(`constructor`, function() {
    it(`throws if two queues are created with the same name`, async function() {
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

    it(`adds a sync event listener runs the onSync function when a sync event is dispatched`, async function() {
      sandbox.spy(self, 'addEventListener');
      const onSync = sandbox.spy();

      const queue = new Queue('foo', {onSync});

      expect(self.addEventListener.calledOnce).to.be.true;
      expect(self.addEventListener.calledWith('sync')).to.be.true;

      self.dispatchEvent(new SyncEvent('sync', {
        tag: 'workbox-background-sync:foo',
      }));

      // replayRequests should not be called for this due to incorrect tag name
      self.dispatchEvent(new SyncEvent('sync', {
        tag: 'workbox-background-sync:bar',
      }));

      expect(onSync.callCount).to.equal(1);
      expect(onSync.firstCall.args[0].queue).to.equal(queue);
    });

    it(`defaults to calling replayRequests when no onSync function is passed`, async function() {
      sandbox.spy(self, 'addEventListener');
      sandbox.stub(Queue.prototype, 'replayRequests');

      const queue = new Queue('foo');

      expect(self.addEventListener.calledOnce).to.be.true;
      expect(self.addEventListener.calledWith('sync')).to.be.true;

      self.dispatchEvent(new SyncEvent('sync', {
        tag: 'workbox-background-sync:foo',
      }));

      // replayRequests should not be called for this due to incorrect tag name
      self.dispatchEvent(new SyncEvent('sync', {
        tag: 'workbox-background-sync:bar',
      }));

      expect(Queue.prototype.replayRequests.callCount).to.equal(1);
      expect(Queue.prototype.replayRequests.firstCall.args[0].queue)
          .to.equal(queue);
    });

    it(`tries to run the sync logic on instantiation in browsers that don't support the sync event`, async function() {
      // Delete the SyncManager interface to mock a non-supporting browser.
      const originalSyncManager = registration.sync;
      delete registration.sync;

      const onSync = sandbox.spy();

      new Queue('foo', {onSync});
      registration.sync = originalSyncManager;

      expect(onSync.calledOnce).to.be.true;
    });
  });

  describe(`pushRequest`, function() {
    it(`should add the request to the end QueueStore instance`, async function() {
      sandbox.spy(QueueStore.prototype, 'pushEntry');

      const queue = new Queue('a');
      const requestURL = 'https://example.com';
      const requestInit = {
        method: 'POST',
        body: 'testing...',
        headers: {'x-foo': 'bar'},
        mode: 'cors',
      };
      const request = new Request(requestURL, requestInit);
      const timestamp = 1234;
      const metadata = {meta: 'data'};

      await queue.pushRequest({request, timestamp, metadata});

      expect(QueueStore.prototype.pushEntry.callCount).to.equal(1);

      const args = QueueStore.prototype.pushEntry.firstCall.args;
      expect(args[0].requestData.url).to.equal(requestURL);
      expect(args[0].requestData.method).to.equal(requestInit.method);
      expect(args[0].requestData.headers).to.deep.equal(requestInit.headers);
      expect(args[0].requestData.mode).to.deep.equal(requestInit.mode);
      expect(args[0].requestData.body).to.be.instanceOf(Blob);
      expect(args[0].timestamp).to.equal(timestamp);
      expect(args[0].metadata).to.deep.equal(metadata);
    });

    it(`should not require metadata`, async function() {
      sandbox.spy(QueueStore.prototype, 'pushEntry');

      const queue = new Queue('a');
      const request = new Request('https://example.com');

      await queue.pushRequest({request});

      expect(QueueStore.prototype.pushEntry.callCount).to.equal(1);

      const args = QueueStore.prototype.pushEntry.firstCall.args;
      expect(args[0].metadata).to.be.undefined;
    });

    it(`should use the current time as the timestamp when not specified`, async function() {
      sandbox.spy(QueueStore.prototype, 'pushEntry');

      sandbox.useFakeTimers({
        toFake: ['Date'],
        now: 1234,
      });

      const queue = new Queue('a');
      const request = new Request('https://example.com');

      await queue.pushRequest({request});

      expect(QueueStore.prototype.pushEntry.callCount).to.equal(1);

      const args = QueueStore.prototype.pushEntry.firstCall.args;
      expect(args[0].timestamp).to.equal(1234);
    });

    it(`should register to receive sync events for a unique tag`, async function() {
      sandbox.stub(self.registration, 'sync').value({
        register: sinon.stub().resolves(),
      });

      const queue = new Queue('foo');

      await queue.pushRequest({request: new Request('/')});

      expect(self.registration.sync.register.calledOnce).to.be.true;
      expect(self.registration.sync.register.calledWith(
          'workbox-background-sync:foo')).to.be.true;
    });
  });

  describe(`unshiftRequest`, function() {
    it(`should add the request to the beginning of the QueueStore`, async function() {
      sandbox.spy(QueueStore.prototype, 'unshiftEntry');

      const queue = new Queue('a');
      const requestURL = 'https://example.com';
      const requestInit = {
        method: 'POST',
        body: 'testing...',
        headers: {'x-foo': 'bar'},
        mode: 'cors',
      };
      const request = new Request(requestURL, requestInit);
      const timestamp = 1234;
      const metadata = {meta: 'data'};

      await queue.unshiftRequest({request, timestamp, metadata});

      expect(QueueStore.prototype.unshiftEntry.callCount).to.equal(1);

      const args = QueueStore.prototype.unshiftEntry.firstCall.args;
      expect(args[0].requestData.url).to.equal(requestURL);
      expect(args[0].requestData.method).to.equal(requestInit.method);
      expect(args[0].requestData.headers).to.deep.equal(requestInit.headers);
      expect(args[0].requestData.mode).to.deep.equal(requestInit.mode);
      expect(args[0].requestData.body).to.be.instanceOf(Blob);
      expect(args[0].timestamp).to.equal(timestamp);
      expect(args[0].metadata).to.deep.equal(metadata);
    });

    it(`should not require metadata`, async function() {
      sandbox.spy(QueueStore.prototype, 'unshiftEntry');

      const queue = new Queue('a');
      const request = new Request('https://example.com');

      await queue.unshiftRequest({request});

      expect(QueueStore.prototype.unshiftEntry.callCount).to.equal(1);

      const args = QueueStore.prototype.unshiftEntry.firstCall.args;
      expect(args[0].metadata).to.be.undefined;
    });

    it(`should use the current time as the timestamp when not specified`, async function() {
      sandbox.spy(QueueStore.prototype, 'unshiftEntry');

      const queue = new Queue('a');
      const request = new Request('https://example.com');

      const startTime = Date.now();
      await queue.unshiftRequest({request});
      const endTime = Date.now();

      expect(QueueStore.prototype.unshiftEntry.callCount).to.equal(1);

      const args = QueueStore.prototype.unshiftEntry.firstCall.args;
      expect(args[0].timestamp >= startTime).to.be.ok;
      expect(args[0].timestamp <= endTime).to.be.ok;
    });

    it(`should register to receive sync events for a unique tag`, async function() {
      sandbox.stub(self.registration, 'sync').value({
        register: sinon.stub().resolves(),
      });

      const queue = new Queue('foo');

      await queue.unshiftRequest({request: new Request('/')});

      expect(self.registration.sync.register.calledOnce).to.be.true;
      expect(self.registration.sync.register.calledWith(
          'workbox-background-sync:foo')).to.be.true;
    });
  });

  describe(`shiftRequest`, function() {
    it(`gets and removes the first request in the QueueStore instance`, async function() {
      sandbox.spy(QueueStore.prototype, 'shiftEntry');

      const queue = new Queue('a');
      const requestURL = 'https://example.com';
      const requestInit = {
        method: 'POST',
        body: 'testing...',
        headers: {'x-foo': 'bar'},
        mode: 'cors',
      };

      await queue.pushRequest({request: new Request(requestURL, requestInit)});
      // Add a second request to ensure the first one is returned.
      await queue.pushRequest({request: new Request('/two')});

      const {request} = await queue.shiftRequest();

      expect(QueueStore.prototype.shiftEntry.callCount).to.equal(1);
      expect(request.url).to.equal(requestURL);
      expect(request.method).to.equal(requestInit.method);
      expect(request.mode).to.deep.equal(requestInit.mode);
      expect(await request.text()).to.equal(requestInit.body);
      expect(request.headers.get('x-foo')).to.equal(
          requestInit.headers['x-foo']);
    });

    it(`returns the timestamp and any passed metadata along with the request`, async function() {
      const queue = new Queue('a');

      await queue.pushRequest({
        metadata: {meta: 'data'},
        request: new Request('/one'),
      });

      const {request, metadata} = await queue.shiftRequest();

      expect(request.url).to.equal('/one');
      expect(metadata).to.deep.equal({meta: 'data'});
    });

    it(`does not return requests that have expired`, async function() {
      const queue = new Queue('a');

      await queue.pushRequest({request: new Request('/one'), timestamp: 12});
      await queue.pushRequest({request: new Request('/two')});
      await queue.pushRequest({request: new Request('/three'), timestamp: 34});
      await queue.pushRequest({request: new Request('/four')});

      const entry1 = await queue.shiftRequest();
      const entry2 = await queue.shiftRequest();
      const entry3 = await queue.shiftRequest();

      expect(entry1.request.url).to.equal('/two');
      expect(entry2.request.url).to.equal('/four');
      expect(entry3).to.be.undefined;
    });
  });

  describe(`popRequest`, function() {
    it(`gets and removes the last request in the QueueStore instance`, async function() {
      sandbox.spy(QueueStore.prototype, 'popEntry');

      const queue = new Queue('a');
      const requestURL = 'https://example.com';
      const requestInit = {
        method: 'POST',
        body: 'testing...',
        headers: {'x-foo': 'bar'},
        mode: 'cors',
      };

      // Add a second request to ensure the last one is returned.
      await queue.pushRequest({request: new Request('/two')});
      await queue.pushRequest({request: new Request(requestURL, requestInit)});

      const {request} = await queue.popRequest();

      expect(QueueStore.prototype.popEntry.callCount).to.equal(1);
      expect(request.url).to.equal(requestURL);
      expect(request.method).to.equal(requestInit.method);
      expect(request.mode).to.deep.equal(requestInit.mode);
      expect(await request.text()).to.equal(requestInit.body);
      expect(request.headers.get('x-foo')).to.equal(
          requestInit.headers['x-foo']);
    });

    it(`returns the timestamp and any passed metadata along with the request`, async function() {
      const queue = new Queue('a');

      await queue.pushRequest({
        metadata: {meta: 'data'},
        request: new Request('/one'),
      });

      const {request, metadata} = await queue.popRequest();

      expect(request.url).to.equal('/one');
      expect(metadata).to.deep.equal({meta: 'data'});
    });

    it(`does not return requests that have expired`, async function() {
      const queue = new Queue('a');

      await queue.pushRequest({request: new Request('/one'), timestamp: 12});
      await queue.pushRequest({request: new Request('/two')});
      await queue.pushRequest({request: new Request('/three'), timestamp: 34});
      await queue.pushRequest({request: new Request('/four')});

      const entry1 = await queue.popRequest();
      const entry2 = await queue.popRequest();
      const entry3 = await queue.popRequest();

      expect(entry1.request.url).to.equal('/four');
      expect(entry2.request.url).to.equal('/two');
      expect(entry3).to.be.undefined;
    });
  });

  describe(`replayRequests`, function() {
    it(`should try to re-fetch all requests in the queue`, async function() {
      sandbox.spy(self, 'fetch');

      const queue1 = new Queue('foo');
      const queue2 = new Queue('bar');

      // Add requests for both queues to ensure only the requests from
      // the matching queue are replayed.
      await queue1.pushRequest({request: new Request('/one')});
      await queue2.pushRequest({request: new Request('/two')});
      await queue1.pushRequest({request: new Request('/three')});
      await queue2.pushRequest({request: new Request('/four')});
      await queue1.pushRequest({request: new Request('/five')});

      await queue1.replayRequests();

      expect(self.fetch.callCount).to.equal(3);

      expect(self.fetch.getCall(0).calledWith(sinon.match({
        url: '/one',
      }))).to.be.true;

      expect(self.fetch.getCall(1).calledWith(sinon.match({
        url: '/three',
      }))).to.be.true;

      expect(self.fetch.getCall(2).calledWith(sinon.match({
        url: '/five',
      }))).to.be.true;

      await queue2.replayRequests();
      expect(self.fetch.callCount).to.equal(5);

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
      await queue1.pushRequest({request: new Request('/one')});
      await queue2.pushRequest({request: new Request('/two')});
      await queue1.pushRequest({request: new Request('/three')});
      await queue2.pushRequest({request: new Request('/four')});
      await queue1.pushRequest({request: new Request('/five')});

      await queue1.replayRequests();
      expect(self.fetch.callCount).to.equal(3);

      const entries = await getObjectStoreEntries();
      expect(entries.length).to.equal(2);
      expect(entries[0].requestData.url).to.equal('/two');
      expect(entries[1].requestData.url).to.equal('/four');
    });

    it(`should ignore (and remove) requests if maxRetentionTime has passed`, async function() {
      sandbox.spy(self, 'fetch');
      const clock = sandbox.useFakeTimers({
        now: Date.now(),
        toFake: ['Date'],
      });

      const queue = new Queue('foo', {
        maxRetentionTime: 1,
      });

      await queue.pushRequest({request: new Request('/one')});
      await queue.pushRequest({request: new Request('/two')});

      clock.tick(1 * MINUTES + 1); // One minute and 1ms.

      await queue.pushRequest({request: new Request('/three')});
      await queue.replayRequests();

      expect(self.fetch.calledOnce).to.be.true;
      expect(self.fetch.calledWith(sinon.match({
        url: '/three',
      }))).to.be.true;

      const entries = await getObjectStoreEntries();
      // Assert that the two requests not replayed were deleted.
      expect(entries.length).to.equal(0);
    });

    it(`should stop replaying if a request fails`, async function() {
      sandbox.stub(self, 'fetch')
          .onCall(3).rejects(new Error())
          .callThrough();

      const queue = new Queue('foo');

      await queue.pushRequest({request: new Request('/one')});
      await queue.pushRequest({request: new Request('/two')});
      await queue.pushRequest({request: new Request('/three')});
      await queue.pushRequest({request: new Request('/four')});
      await queue.pushRequest({request: new Request('/five')});

      await expectError(() => {
        return queue.replayRequests(); // The 4th requests should fail.
      }, 'queue-replay-failed');

      const entries = await getObjectStoreEntries();
      expect(entries.length).to.equal(2);
      expect(entries[0].requestData.url).to.equal('/four');
      expect(entries[1].requestData.url).to.equal('/five');
    });

    it(`should throw WorkboxError if re-fetching fails`, async function() {
      sandbox.stub(self, 'fetch')
          .onCall(1).rejects(new Error())
          .callThrough();

      const failureURL = '/two';
      const queue = new Queue('foo');

      // Add requests for both queues to ensure only the requests from
      // the matching queue are replayed.
      await queue.pushRequest({request: new Request('/one')});
      await queue.pushRequest({request: new Request(failureURL)});

      await expectError(() => {
        return queue.replayRequests();
      }, 'queue-replay-failed');
    });
  });

  describe(`registerSync()`, function() {
    it(`should support registerSync() in supporting browsers`, async function() {
      const queue = new Queue('foo');
      await queue.registerSync();
    });

    it(`should support registerSync() in non-supporting browsers`, async function() {
      // Delete the SyncManager interface to mock a non-supporting browser.
      const originalSyncManager = registration.sync;
      delete registration.sync;

      const queue = new Queue('foo');
      await queue.registerSync();

      registration.sync = originalSyncManager;
    });

    it(`should handle thrown errors in sync registration`, async function() {
      sandbox.stub(registration.sync, 'register').callsFake(() => {
        return Promise.reject(new Error('Injected Error'));
      });

      const queue = new Queue('foo');
      await queue.registerSync();
    });
  });
});
