/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {Queue} from 'workbox-background-sync/Queue.mjs';
import {QueueDb} from 'workbox-background-sync/lib/QueueDb.mjs';
import {openDB} from 'idb';
import {QueueStore} from 'workbox-background-sync/lib/QueueStore.mjs';
import {logger} from 'workbox-core/_private/logger.mjs';
import {dispatchAndWaitUntilDone} from '../../../infra/testing/helpers/extendable-event-utils.mjs';

const MINUTES = 60 * 1000;

describe(`Queue`, function () {
  const sandbox = sinon.createSandbox();
  let db = null;

  beforeEach(async function () {
    Queue._queueNames.clear();
    db = await openDB('workbox-background-sync', 3, {
      upgrade: QueueDb.prototype._upgradeDb,
    });
    await db.clear('requests');
    sandbox.restore();

    // Spy on all added event listeners so they can be removed.
    sandbox.spy(self, 'addEventListener');

    if (process.env.NODE_ENV !== 'production') {
      sandbox.stub(logger);
    }

    // Don't actually register for a sync event in any test, as it could
    // make the tests non-deterministic.
    if ('sync' in registration) {
      sandbox.stub(registration.sync, 'register');
    }

    sandbox.stub(Queue.prototype, 'replayRequests');
  });

  afterEach(function () {
    for (const args of self.addEventListener.args) {
      self.removeEventListener(...args);
    }
    sandbox.restore();
  });

  describe(`constructor`, function () {
    it(`throws if two queues are created with the same name`, async function () {
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

    it(`adds a sync event listener (if supported) that runs the onSync function when a sync event is dispatched`, async function () {
      if (!('sync' in registration)) this.skip();

      const onSync = sandbox.spy();

      const queue = new Queue('foo', {onSync});

      // `addEventListener` is spied on in the beforeEach hook.
      expect(self.addEventListener.calledOnce).to.be.true;
      expect(self.addEventListener.calledWith('sync')).to.be.true;

      await dispatchAndWaitUntilDone(
        new SyncEvent('sync', {
          tag: 'workbox-background-sync:foo',
        }),
      );

      // `onSync` should not be called because the tag won't match.
      await dispatchAndWaitUntilDone(
        new SyncEvent('sync', {
          tag: 'workbox-background-sync:bar',
        }),
      );

      expect(onSync.callCount).to.equal(1);
      expect(onSync.firstCall.args[0].queue).to.equal(queue);
    });

    it(`defaults to calling replayRequests (if supported) when no onSync function is passed`, async function () {
      if (!('sync' in registration)) this.skip();

      const queue = new Queue('foo');

      // `addEventListener` is spied on in the beforeEach hook.
      expect(self.addEventListener.calledOnce).to.be.true;
      expect(self.addEventListener.calledWith('sync')).to.be.true;

      await dispatchAndWaitUntilDone(
        new SyncEvent('sync', {
          tag: 'workbox-background-sync:foo',
        }),
      );

      // `replayRequests` should not be called because the tag won't match.
      await dispatchAndWaitUntilDone(
        new SyncEvent('sync', {
          tag: 'workbox-background-sync:bar',
        }),
      );

      // `replayRequsets` is stubbed in beforeEach, so we don't have to
      // re-stub in this test, and we can just assert it was called.
      expect(Queue.prototype.replayRequests.callCount).to.equal(1);
      expect(Queue.prototype.replayRequests.firstCall.args[0].queue).to.equal(
        queue,
      );
    });

    it(`registers a tag (if supported) if entries were added to the queue during a successful sync`, async function () {
      if (!('sync' in registration)) this.skip();

      const onSync = sandbox.stub().callsFake(async ({queue}) => {
        await queue.pushRequest({
          request: new Request('/one', {method: 'POST', body: '...'}),
        });
        await queue.pushRequest({
          request: new Request('/two', {method: 'POST', body: '...'}),
        });
        await queue.pushRequest({
          request: new Request('/three', {method: 'POST', body: '...'}),
        });
      });

      const queue = new Queue('foo', {onSync});
      sandbox.spy(queue, 'registerSync');

      await dispatchAndWaitUntilDone(
        new SyncEvent('sync', {
          tag: 'workbox-background-sync:foo',
        }),
      );

      expect(queue.registerSync.callCount).to.equal(1);
    });

    it(`doesn't re-register after a sync event fails`, async function () {
      if (!('sync' in registration)) this.skip();

      const onSync = async ({queue}) => {
        await queue.pushRequest({
          request: new Request('/one', {method: 'POST', body: '...'}),
        });
        throw new Error('sync failed');
      };

      const queue = new Queue('foo', {onSync});
      sandbox.spy(queue, 'registerSync');

      await dispatchAndWaitUntilDone(
        new SyncEvent('sync', {
          tag: 'workbox-background-sync:foo',
        }),
      );

      expect(queue.registerSync.callCount).to.equal(0);
    });

    it(`re-registers a tag after a sync event fails if event.lastChance is true`, async function () {
      if (!('sync' in registration)) this.skip();

      const onSync = async ({queue}) => {
        await queue.pushRequest({
          request: new Request('/one', {method: 'POST', body: '...'}),
        });
        throw new Error('sync failed');
      };

      const queue = new Queue('foo', {onSync});
      sandbox.spy(queue, 'registerSync');

      const syncEvent = new SyncEvent('sync', {
        tag: 'workbox-background-sync:foo',
      });
      sandbox.stub(syncEvent, 'lastChance').value(true);
      await dispatchAndWaitUntilDone(syncEvent);

      expect(queue.registerSync.callCount).to.equal(1);
    });

    it(`tries to run the sync logic on instantiation iff the browser doesn't support Background Sync`, async function () {
      const onSync = sandbox.spy();
      new Queue('foo', {onSync});

      if ('sync' in registration) {
        expect(onSync.calledOnce).to.be.false;
      } else {
        expect(onSync.calledOnce).to.be.true;
      }
    });

    it(`should run 'onSync' on instantiation when forceSyncFallback is set`, async function () {
      const onSync = sandbox.spy();
      new Queue('foo', {onSync, forceSyncFallback: true});

      expect(onSync.calledOnce).to.be.true;
    });
  });

  describe(`pushRequest`, function () {
    it(`should add the request to the end QueueStore instance`, async function () {
      sandbox.spy(QueueStore.prototype, 'pushEntry');

      const queue = new Queue('a');
      const requestURL = 'https://example.com/';
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
      expect(args[0].requestData.headers['x-foo']).to.equal(
        requestInit.headers['x-foo'],
      );
      expect(args[0].requestData.mode).to.deep.equal(requestInit.mode);
      expect(args[0].requestData.body).to.be.instanceOf(ArrayBuffer);
      expect(args[0].timestamp).to.equal(timestamp);
      expect(args[0].metadata).to.deep.equal(metadata);
    });

    it(`should not require metadata`, async function () {
      sandbox.spy(QueueStore.prototype, 'pushEntry');

      const queue = new Queue('a');
      const request = new Request('https://example.com/');

      await queue.pushRequest({request});

      expect(QueueStore.prototype.pushEntry.callCount).to.equal(1);

      const args = QueueStore.prototype.pushEntry.firstCall.args;
      expect(args[0].metadata).to.be.undefined;
    });

    it(`should use the current time as the timestamp when not specified`, async function () {
      sandbox.spy(QueueStore.prototype, 'pushEntry');

      sandbox.useFakeTimers({
        toFake: ['Date'],
        now: 1234,
      });

      const queue = new Queue('a');
      const request = new Request('https://example.com/');

      await queue.pushRequest({request});

      expect(QueueStore.prototype.pushEntry.callCount).to.equal(1);

      const args = QueueStore.prototype.pushEntry.firstCall.args;
      expect(args[0].timestamp).to.equal(1234);
    });

    it(`should register to receive sync events for a unique tag`, async function () {
      if (!('sync' in registration)) this.skip();

      const queue = new Queue('foo');

      await queue.pushRequest({request: new Request('/')});

      // self.registration.sync.register is stubbed in `beforeEach()`.
      expect(self.registration.sync.register.calledOnce).to.be.true;
      expect(
        self.registration.sync.register.calledWith(
          'workbox-background-sync:foo',
        ),
      ).to.be.true;
    });
  });

  describe(`unshiftRequest`, function () {
    it(`should add the request to the beginning of the QueueStore`, async function () {
      sandbox.spy(QueueStore.prototype, 'unshiftEntry');

      const queue = new Queue('a');
      const requestURL = 'https://example.com/';
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
      expect(args[0].requestData.headers['x-foo']).to.equal(
        requestInit.headers['x-foo'],
      );
      expect(args[0].requestData.mode).to.deep.equal(requestInit.mode);
      expect(args[0].requestData.body).to.be.instanceOf(ArrayBuffer);
      expect(args[0].timestamp).to.equal(timestamp);
      expect(args[0].metadata).to.deep.equal(metadata);
    });

    it(`should not require metadata`, async function () {
      sandbox.spy(QueueStore.prototype, 'unshiftEntry');

      const queue = new Queue('a');
      const request = new Request('https://example.com/');

      await queue.unshiftRequest({request});

      expect(QueueStore.prototype.unshiftEntry.callCount).to.equal(1);

      const args = QueueStore.prototype.unshiftEntry.firstCall.args;
      expect(args[0].metadata).to.be.undefined;
    });

    it(`should use the current time as the timestamp when not specified`, async function () {
      sandbox.spy(QueueStore.prototype, 'unshiftEntry');

      const queue = new Queue('a');
      const request = new Request('https://example.com/');

      const startTime = Date.now();
      await queue.unshiftRequest({request});
      const endTime = Date.now();

      expect(QueueStore.prototype.unshiftEntry.callCount).to.equal(1);

      const args = QueueStore.prototype.unshiftEntry.firstCall.args;
      expect(args[0].timestamp >= startTime).to.be.ok;
      expect(args[0].timestamp <= endTime).to.be.ok;
    });

    it(`should register to receive sync events for a unique tag`, async function () {
      if (!('sync' in registration)) this.skip();

      const queue = new Queue('foo');

      await queue.unshiftRequest({
        request: new Request('/', {method: 'POST', body: '...'}),
      });

      // self.registration.sync.register is stubbed in `beforeEach()`.
      expect(self.registration.sync.register.calledOnce).to.be.true;
      expect(
        self.registration.sync.register.calledWith(
          'workbox-background-sync:foo',
        ),
      ).to.be.true;
    });
  });

  describe(`shiftRequest`, function () {
    it(`gets and removes the first request in the QueueStore instance`, async function () {
      sandbox.spy(QueueStore.prototype, 'shiftEntry');

      const queue = new Queue('a');
      const requestURL = 'https://example.com/';
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
        requestInit.headers['x-foo'],
      );
    });

    it(`returns the timestamp and any passed metadata along with the request`, async function () {
      const queue = new Queue('a');

      await queue.pushRequest({
        metadata: {meta: 'data'},
        request: new Request('/one', {method: 'POST', body: '...'}),
      });

      const {request, metadata} = await queue.shiftRequest();

      expect(request.url).to.equal(`${location.origin}/one`);
      expect(metadata).to.deep.equal({meta: 'data'});
    });

    it(`does not return requests that have expired`, async function () {
      const queue = new Queue('a');

      await queue.pushRequest({
        request: new Request('/one', {method: 'POST', body: '...'}),
        timestamp: 12,
      });
      await queue.pushRequest({
        request: new Request('/two', {method: 'POST', body: '...'}),
      });
      await queue.pushRequest({
        request: new Request('/three', {method: 'POST', body: '...'}),
        timestamp: 34,
      });
      await queue.pushRequest({
        request: new Request('/four', {method: 'POST', body: '...'}),
      });

      const entry1 = await queue.shiftRequest();
      const entry2 = await queue.shiftRequest();
      const entry3 = await queue.shiftRequest();

      expect(entry1.request.url).to.equal(`${location.origin}/two`);
      expect(entry2.request.url).to.equal(`${location.origin}/four`);
      expect(entry3).to.be.undefined;
    });
  });

  describe(`popRequest`, function () {
    it(`gets and removes the last request in the QueueStore instance`, async function () {
      sandbox.spy(QueueStore.prototype, 'popEntry');

      const queue = new Queue('a');
      const requestURL = 'https://example.com/';
      const requestInit = {
        method: 'POST',
        body: 'testing...',
        headers: {'x-foo': 'bar'},
        mode: 'cors',
      };

      // Add a second request to ensure the last one is returned.
      await queue.pushRequest({
        request: new Request('/two', {method: 'POST', body: '...'}),
      });
      await queue.pushRequest({
        request: new Request(requestURL, requestInit),
      });

      const {request} = await queue.popRequest();

      expect(QueueStore.prototype.popEntry.callCount).to.equal(1);
      expect(request.url).to.equal(requestURL);
      expect(request.method).to.equal(requestInit.method);
      expect(request.mode).to.deep.equal(requestInit.mode);
      expect(await request.text()).to.equal(requestInit.body);
      expect(request.headers.get('x-foo')).to.equal(
        requestInit.headers['x-foo'],
      );
    });

    it(`returns the timestamp and any passed metadata along with the request`, async function () {
      const queue = new Queue('a');

      await queue.pushRequest({
        metadata: {meta: 'data'},
        request: new Request('/one'),
      });

      const {request, metadata} = await queue.popRequest();

      expect(request.url).to.equal(`${location.origin}/one`);
      expect(metadata).to.deep.equal({meta: 'data'});
    });

    it(`does not return requests that have expired`, async function () {
      const queue = new Queue('a');

      await queue.pushRequest({
        request: new Request('/one', {method: 'POST', body: '...'}),
        timestamp: 12,
      });
      await queue.pushRequest({
        request: new Request('/two', {method: 'POST', body: '...'}),
      });
      await queue.pushRequest({
        request: new Request('/three', {method: 'POST', body: '...'}),
        timestamp: 34,
      });
      await queue.pushRequest({
        request: new Request('/four', {method: 'POST', body: '...'}),
      });

      const entry1 = await queue.popRequest();
      const entry2 = await queue.popRequest();
      const entry3 = await queue.popRequest();

      expect(entry1.request.url).to.equal(`${location.origin}/four`);
      expect(entry2.request.url).to.equal(`${location.origin}/two`);
      expect(entry3).to.be.undefined;
    });
  });

  describe(`replayRequests`, function () {
    beforeEach(function () {
      // Unstub replayRequests for all tests in this group.
      Queue.prototype.replayRequests.restore();
    });

    it(`should try to re-fetch all requests in the queue`, async function () {
      sandbox.stub(self, 'fetch');

      const queue1 = new Queue('foo');
      const queue2 = new Queue('bar');

      // Add requests for both queues to ensure only the requests from
      // the matching queue are replayed.
      await queue1.pushRequest({
        request: new Request('/one', {method: 'POST', body: '...'}),
      });
      await queue2.pushRequest({
        request: new Request('/two', {method: 'POST', body: '...'}),
      });
      await queue1.pushRequest({
        request: new Request('/three', {method: 'POST', body: '...'}),
      });
      await queue2.pushRequest({
        request: new Request('/four', {method: 'POST', body: '...'}),
      });
      await queue1.pushRequest({
        request: new Request('/five', {method: 'POST', body: '...'}),
      });

      await queue1.replayRequests();

      expect(self.fetch.callCount).to.equal(3);

      expect(
        self.fetch.getCall(0).calledWith(
          sinon.match({
            url: `${location.origin}/one`,
          }),
        ),
      ).to.be.true;

      expect(
        self.fetch.getCall(1).calledWith(
          sinon.match({
            url: `${location.origin}/three`,
          }),
        ),
      ).to.be.true;

      expect(
        self.fetch.getCall(2).calledWith(
          sinon.match({
            url: `${location.origin}/five`,
          }),
        ),
      ).to.be.true;

      await queue2.replayRequests();
      expect(self.fetch.callCount).to.equal(5);

      expect(
        self.fetch.getCall(3).calledWith(
          sinon.match({
            url: `${location.origin}/two`,
          }),
        ),
      ).to.be.true;

      expect(
        self.fetch.getCall(4).calledWith(
          sinon.match({
            url: `${location.origin}/four`,
          }),
        ),
      ).to.be.true;
    });

    it(`should remove requests after a successful retry`, async function () {
      sandbox.spy(self, 'fetch');

      const queue1 = new Queue('foo');
      const queue2 = new Queue('bar');

      // Add requests for both queues to ensure only the requests from
      // the matching queue are replayed.
      await queue1.pushRequest({
        request: new Request('/one', {method: 'POST', body: '...'}),
      });
      await queue2.pushRequest({
        request: new Request('/two', {method: 'POST', body: '...'}),
      });
      await queue1.pushRequest({
        request: new Request('/three', {method: 'POST', body: '...'}),
      });
      await queue2.pushRequest({
        request: new Request('/four', {method: 'POST', body: '...'}),
      });
      await queue1.pushRequest({
        request: new Request('/five', {method: 'POST', body: '...'}),
      });

      await queue1.replayRequests();
      expect(self.fetch.callCount).to.equal(3);

      const entries = await db.getAll('requests');
      expect(entries.length).to.equal(2);
      expect(entries[0].requestData.url).to.equal(`${location.origin}/two`);
      expect(entries[1].requestData.url).to.equal(`${location.origin}/four`);
    });

    it(`should ignore (and remove) requests if maxRetentionTime has passed`, async function () {
      sandbox.spy(self, 'fetch');
      const clock = sandbox.useFakeTimers({
        now: Date.now(),
        toFake: ['Date'],
      });

      const queue = new Queue('foo', {
        maxRetentionTime: 1,
      });

      await queue.pushRequest({
        request: new Request('/one', {method: 'POST', body: '...'}),
      });
      await queue.pushRequest({
        request: new Request('/two', {method: 'POST', body: '...'}),
      });

      clock.tick(1 * MINUTES + 1); // One minute and 1ms.

      await queue.pushRequest({
        request: new Request('/three'),
      });
      await queue.replayRequests();

      expect(self.fetch.calledOnce).to.be.true;
      expect(
        self.fetch.calledWith(
          sinon.match({
            url: `${location.origin}/three`,
          }),
        ),
      ).to.be.true;

      const entries = await db.getAll('requests');
      // Assert that the two requests not replayed were deleted.
      expect(entries.length).to.equal(0);
    });

    it(`should stop replaying if a request fails`, async function () {
      sandbox
        .stub(self, 'fetch')
        .onCall(3)
        .callsFake(async (request) => {
          // Use the body to ensure everything is cloned beforehand.
          await request.text();
          throw new Error('network error');
        })
        .callThrough();

      const queue = new Queue('foo');

      await queue.pushRequest({
        request: new Request('/one', {method: 'POST', body: '...'}),
      });
      await queue.pushRequest({
        request: new Request('/two', {method: 'POST', body: '...'}),
      });
      await queue.pushRequest({
        request: new Request('/three', {method: 'POST', body: '...'}),
      });
      await queue.pushRequest({
        request: new Request('/four', {method: 'POST', body: '...'}),
      });
      await queue.pushRequest({
        request: new Request('/five', {method: 'POST', body: '...'}),
      });

      await expectError(() => {
        return queue.replayRequests(); // The 4th requests should fail.
      }, 'queue-replay-failed');

      const entries = await db.getAll('requests');
      expect(entries.length).to.equal(2);
      expect(entries[0].requestData.url).to.equal(`${location.origin}/four`);
      expect(entries[1].requestData.url).to.equal(`${location.origin}/five`);
    });

    it(`should throw WorkboxError if re-fetching fails`, async function () {
      sandbox
        .stub(self, 'fetch')
        .onCall(1)
        .callsFake(async (request) => {
          // Use the body to ensure everything is cloned beforehand.
          await request.text();
          throw new Error('network error');
        })
        .callThrough();

      const queue = new Queue('foo');

      // Add requests for both queues to ensure only the requests from
      // the matching queue are replayed.
      await queue.pushRequest({
        request: new Request('/one', {method: 'POST', body: '...'}),
      });
      await queue.pushRequest({
        request: new Request('/two', {method: 'POST', body: '...'}),
      });

      await expectError(() => {
        return queue.replayRequests();
      }, 'queue-replay-failed');
    });
  });

  describe(`registerSync()`, function () {
    it(`should succeed regardless of browser support for sync`, async function () {
      const queue = new Queue('a');
      await queue.registerSync();
    });

    it(`should handle thrown errors in sync registration`, async function () {
      if (!('sync' in registration)) this.skip();

      registration.sync.register.restore();

      sandbox.stub(registration.sync, 'register').callsFake(() => {
        return Promise.reject(new Error('Injected Error'));
      });

      const queue = new Queue('a');
      await queue.registerSync();
    });
  });

  describe(`getAll()`, function () {
    it(`returns all requests in the QueueStore instance`, async function () {
      const queue = new Queue('a');

      const request1 = new Request('/one', {method: 'POST', body: '...'});
      const request2 = new Request('/two', {method: 'POST', body: '...'});
      const request3 = new Request('/three', {method: 'POST', body: '...'});

      await queue.pushRequest({request: request1});
      await queue.pushRequest({request: request2});
      await queue.pushRequest({
        request: request3,
        metadata: {meta: 'data'},
      });

      const entries = await queue.getAll();
      expect(entries.length).to.equal(3);
      expect(entries[0].request).to.deep.equal(request1);
      expect(entries[0].metadata).to.equal(undefined);
      expect(entries[1].request).to.deep.equal(request2);
      expect(entries[1].metadata).to.equal(undefined);
      expect(entries[2].request).to.deep.equal(request3);
      expect(entries[2].metadata).to.deep.equal({meta: 'data'});

      // Ensure the entries aren't deleted.
      expect(await db.getAll('requests')).to.have.lengthOf(3);
    });

    it(`doesn't return expired entries (and it deletes them)`, async function () {
      const queue = new Queue('a');

      const request1 = new Request('/one', {method: 'POST', body: '...'});
      const request2 = new Request('/two', {method: 'POST', body: '...'});
      const request3 = new Request('/three', {method: 'POST', body: '...'});

      await queue.pushRequest({request: request1});
      await queue.pushRequest({
        request: request2,
        timestamp: Date.now() - 1e12,
      });
      await queue.pushRequest({
        request: request3,
        metadata: {meta: 'data'},
      });

      const entries = await queue.getAll();
      expect(entries.length).to.equal(2);
      expect(entries[0].request).to.deep.equal(request1);
      expect(entries[0].metadata).to.equal(undefined);
      expect(entries[1].request).to.deep.equal(request3);
      expect(entries[1].metadata).to.deep.equal({meta: 'data'});

      // Ensure the expired entry was deleted.
      expect(await db.getAll('requests')).to.have.lengthOf(2);
    });
  });

  describe(`size()`, function () {
    it(`returns the number of requests in the QueueStore instance`, async function () {
      const queue = new Queue('a');

      const request1 = new Request('/one', {method: 'POST', body: '...'});
      const request2 = new Request('/two', {method: 'POST', body: '...'});
      const request3 = new Request('/three', {method: 'POST', body: '...'});

      await queue.pushRequest({request: request1});
      await queue.pushRequest({request: request2});
      await queue.pushRequest({
        request: request3,
        metadata: {meta: 'data'},
      });

      expect(await queue.size()).to.equal(3);
    });
  });
});
