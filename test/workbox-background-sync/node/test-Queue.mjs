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
import {DB_NAME, OBJECT_STORE_NAME} from
  '../../../packages/workbox-background-sync/utils/constants.mjs';
import {DBWrapper} from '../../../packages/workbox-core/_private/DBWrapper.mjs';
import {resetEventListeners} from
  '../../../infra/testing/sw-env-mocks/event-listeners.js';

const MINUTES = 60 * 1000;

const getObjectStoreEntries = async () => {
  return await new DBWrapper(DB_NAME, 1).getAll(OBJECT_STORE_NAME);
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
      sandbox.stub(Queue.prototype, 'replayRequests');

      new Queue('foo');

      expect(self.addEventListener.calledOnce).to.be.true;
      expect(self.addEventListener.calledWith('sync')).to.be.true;

      self.dispatchEvent(new SyncEvent('sync', {
        tag: 'workbox-background-sync:foo',
      }));

      // replayRequests should not be called for this due to incorrect tag name
      self.dispatchEvent(new SyncEvent('sync', {
        tag: 'workbox-background-sync:bar',
      }));

      expect(Queue.prototype.replayRequests.calledOnce).to.be.true;
    });

    it(`should try to replay the queue on SW startup in browsers that ` +
        `don't support the sync event`, async function() {
      // Delete the SyncManager interface to mock a non-supporting browser.
      const originalSyncManager = registration.sync;
      delete registration.sync;

      sandbox.stub(Queue.prototype, 'replayRequests');

      new Queue('foo');

      expect(Queue.prototype.replayRequests.calledOnce).to.be.true;

      registration.sync = originalSyncManager;
    });
  });

  describe(`addRequest`, function() {
    it(`should serialize the request and store it in IndexedDB`,
        async function() {
          const now = Date.now();
          const queue = new Queue('foo');
          const requestUrl = 'https://example.com';
          const requestInit = {
            method: 'POST',
            body: 'testing...',
            headers: {'x-foo': 'bar'},
            mode: 'cors',
          };
          const request = new Request(requestUrl, requestInit);

          await queue.addRequest(request);

          const entries = await getObjectStoreEntries();
          expect(entries).to.have.lengthOf(1);
          expect(entries[0].storableRequest.url).to.equal(requestUrl);
          expect(entries[0].storableRequest.timestamp).to.be.at.least(now);
          expect(entries[0].storableRequest.requestInit).to.have.keys([
            'method',
            'body',
            'headers',
            'mode',
            'credentials',
          ]);
        });

    it(`should register to receive sync events for a unique tag`,
        async function() {
          sandbox.stub(self.registration, 'sync').value({
            register: sinon.stub().resolves(),
          });

          const queue = new Queue('foo');
          const requestUrl = 'https://example.com';
          const requestInit = {
            method: 'POST',
            body: 'testing...',
            headers: {'x-foo': 'bar'},
            mode: 'cors',
          };
          const request = new Request(requestUrl, requestInit);

          await queue.addRequest(request);

          expect(self.registration.sync.register.calledOnce).to.be.true;
          expect(self.registration.sync.register.calledWith(
              'workbox-background-sync:foo')).to.be.true;
        });

    it(`should invoke the requestWillEnqueue callback`, async function() {
      const queue = new Queue('foo', {
        callbacks: {
          requestWillEnqueue: (storableRequest) => {
            storableRequest.url += '?q=foo';
          },
        },
      });

      const request = new Request('/');
      await queue.addRequest(request);

      const entries = await getObjectStoreEntries();
      expect(entries).to.have.lengthOf(1);
      expect(entries[0].storableRequest.url).to.equal('/?q=foo');
    });

    it(`should support modifying the stored request via requestWillEnqueue`,
        async function() {
          const requestWillEnqueue = sinon.spy();
          const queue = new Queue('foo', {
            callbacks: {requestWillEnqueue},
          });

          const request = new Request('/');
          await queue.addRequest(request);

          expect(requestWillEnqueue.calledOnce).to.be.true;
          expect(requestWillEnqueue.calledWith(sinon.match({
            url: '/',
            timestamp: sinon.match.number,
            requestInit: sinon.match.object,
          }))).to.be.true;
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
      await queue1.addRequest(new Request('/one'));
      await queue2.addRequest(new Request('/two'));
      await queue1.addRequest(new Request('/three'));
      await queue2.addRequest(new Request('/four'));
      await queue1.addRequest(new Request('/five'));

      await queue1.replayRequests();
      expect(self.fetch.callCount).to.equal(3);

      const entries = await getObjectStoreEntries();
      expect(entries.length).to.equal(2);
      expect(entries[0].storableRequest.url).to.equal('/two');
      expect(entries[1].storableRequest.url).to.equal('/four');
    });

    it(`should ignore (and remove) requests if maxRetentionTime has passed`,
        async function() {
          sandbox.spy(self, 'fetch');
          const clock = sandbox.useFakeTimers({
            now: Date.now(),
            toFake: ['Date'],
          });

          const queue = new Queue('foo', {
            maxRetentionTime: 1,
          });

          await queue.addRequest(new Request('/one'));
          await queue.addRequest(new Request('/two'));

          clock.tick(1 * MINUTES + 1); // One minute and 1ms.

          await queue.addRequest(new Request('/three'));
          await queue.replayRequests();

          expect(self.fetch.calledOnce).to.be.true;
          expect(self.fetch.calledWith(sinon.match({
            url: '/three',
          }))).to.be.true;

          const entries = await getObjectStoreEntries();
          // Assert that the two requests not replayed were deleted.
          expect(entries.length).to.equal(0);
        });

    it(`should keep a request in the queue if re-fetching fails`,
        async function() {
          sandbox.stub(self, 'fetch')
              .onCall(1).rejects(new Error())
              .onCall(3).rejects(new Error())
              .callThrough();

          const queue = new Queue('foo');

          await queue.addRequest(new Request('/one'));
          await queue.addRequest(new Request('/two'));
          await queue.addRequest(new Request('/three'));
          await queue.addRequest(new Request('/four'));
          await queue.addRequest(new Request('/five'));

          await expectError(() => {
            return queue.replayRequests(); // The 2nd and 4th requests should fail.
          }, 'queue-replay-failed');

          const entries = await getObjectStoreEntries();
          expect(entries.length).to.equal(2);
          expect(entries[0].storableRequest.url).to.equal('/two');
          expect(entries[1].storableRequest.url).to.equal('/four');
        });

    it(`should throw WorkboxError if re-fetching fails`,
        async function() {
          sandbox.stub(self, 'fetch')
              .onCall(1).rejects(new Error())
              .callThrough();

          const failureURL = '/two';
          const queue = new Queue('foo');

          // Add requests for both queues to ensure only the requests from
          // the matching queue are replayed.
          await queue.addRequest(new Request('/one'));
          await queue.addRequest(new Request(failureURL));

          await expectError(() => {
            return queue.replayRequests();
          }, 'queue-replay-failed');
        });

    it(`should invoke all replay callbacks`, async function() {
      const requestWillReplay = sinon.spy();
      const queueDidReplay = sinon.spy();

      const queue = new Queue('foo', {
        callbacks: {
          requestWillReplay,
          queueDidReplay,
        },
      });

      await queue.addRequest(new Request('/one'));
      await queue.addRequest(new Request('/two'));
      await queue.replayRequests();

      expect(requestWillReplay.calledTwice).to.be.true;
      expect(requestWillReplay.getCall(0).calledWith(sinon.match({
        url: '/one',
        timestamp: sinon.match.number,
        requestInit: sinon.match.object,
      }))).to.be.true;
      expect(requestWillReplay.getCall(1).calledWith(sinon.match({
        url: '/two',
        timestamp: sinon.match.number,
        requestInit: sinon.match.object,
      }))).to.be.true;

      expect(queueDidReplay.calledOnce).to.be.true;
      expect(queueDidReplay.calledWith(sinon.match([
        sinon.match({
          request: sinon.match.instanceOf(Request).and(
              sinon.match({url: '/one'})),
          response: sinon.match.instanceOf(Response),
        }),
        sinon.match({
          request: sinon.match.instanceOf(Request).and(
              sinon.match({url: '/two'})),
          response: sinon.match.instanceOf(Response),
        }),
      ]))).to.be.true;

      requestWillReplay.resetHistory();
      queueDidReplay.resetHistory();

      sandbox.stub(self, 'fetch')
          .onCall(1).rejects(new Error())
          .callThrough();

      await queue.addRequest(new Request('/three'));
      await queue.addRequest(new Request('/four'));
      await expectError(() => {
        return queue.replayRequests();
      }, 'queue-replay-failed');

      expect(requestWillReplay.calledTwice).to.be.true;

      expect(queueDidReplay.calledOnce).to.be.true;
      expect(queueDidReplay.calledWith(sinon.match([
        sinon.match({
          request: sinon.match.instanceOf(Request).and(
              sinon.match({url: '/three'})),
          response: sinon.match.instanceOf(Response),
        }),
        sinon.match({
          request: sinon.match.instanceOf(Request).and(
              sinon.match({url: '/four'})),
          error: sinon.match.instanceOf(Error),
        }),
      ]))).to.be.true;
    });

    it(`should support modifying the request via the requestWillReplay`,
        async function() {
          sandbox.spy(self, 'fetch');

          const requestWillReplay = (storableRequest) => {
            storableRequest.url += '?q=foo';
          };

          const queue = new Queue('foo', {
            callbacks: {requestWillReplay},
          });

          await queue.addRequest(new Request('/one'));
          await queue.addRequest(new Request('/two'));
          await queue.replayRequests();

          expect(self.fetch.calledTwice).to.be.true;
          expect(self.fetch.getCall(0).calledWith(sinon.match({
            url: '/one?q=foo',
          }))).to.be.true;
          expect(self.fetch.getCall(1).calledWith(sinon.match({
            url: '/two?q=foo',
          }))).to.be.true;
        });

    it(`should store the original request if a modified request replay fails`,
        async function() {
          sandbox.stub(self, 'fetch').rejects();
          sandbox.spy(QueueStore.prototype, 'addEntry');

          const requestWillReplay = (storableRequest) => {
            storableRequest.url += '?q=foo';
            storableRequest.requestInit.headers['x-foo'] = 'bar';
          };

          const queue = new Queue('foo', {
            callbacks: {requestWillReplay},
          });

          await queue.addRequest(new Request('/one'));
          await queue.addRequest(new Request('/two'));


          await expectError(() => {
            return queue.replayRequests();
          }, 'queue-replay-failed');

          // Ensure the re-enqueued requests are the same as the originals.
          expect(QueueStore.prototype.addEntry.getCall(0).args).to.deep.equal(
              QueueStore.prototype.addEntry.getCall(2).args);
          expect(QueueStore.prototype.addEntry.getCall(1).args).to.deep.equal(
              QueueStore.prototype.addEntry.getCall(3).args);
        });
  });

  describe(`_registerSync()`, function() {
    it(`should support _registerSync() in supporting browsers`, async function() {
      const queue = new Queue('foo');
      await queue._registerSync();
    });

    it(`should support _registerSync() in non-supporting browsers`, async function() {
      // Delete the SyncManager interface to mock a non-supporting browser.
      const originalSyncManager = registration.sync;
      delete registration.sync;

      const queue = new Queue('foo');
      await queue._registerSync();

      registration.sync = originalSyncManager;
    });

    it(`should handle thrown errors in sync registration`, async function() {
      sandbox.stub(registration.sync, 'register').callsFake(() => {
        return Promise.reject(new Error('Injected Error'));
      });

      const queue = new Queue('foo');
      await queue._registerSync();
    });
  });
});
