/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {expect} from 'chai';
import * as sinon from 'sinon';

import waitUntil from '../../../infra/testing/wait-until';

import {Deferred} from '../../../packages/workbox-core/_private/Deferred.mjs';
import {BroadcastCacheUpdate} from '../../../packages/workbox-broadcast-update/BroadcastCacheUpdate.mjs';
import {
  CACHE_UPDATED_MESSAGE_META,
  CACHE_UPDATED_MESSAGE_TYPE,
  DEFAULT_BROADCAST_CHANNEL_NAME,
  DEFAULT_DEFER_NOTIFICATION_TIMEOUT,
  DEFAULT_HEADERS_TO_CHECK,
} from '../../../packages/workbox-broadcast-update/utils/constants.mjs';

describe(`[workbox-broadcast-cache-udpate] BroadcastCacheUpdate`, function() {
  const sandbox = sinon.createSandbox();

  beforeEach(function() {
    sandbox.restore();
  });

  after(function() {
    sandbox.restore();
  });

  describe(`constructor()`, function() {
    it(`should use the passed channelName`, function() {
      const channelName = 'my-channel';
      const bcu = new BroadcastCacheUpdate({channelName});
      expect(bcu._channelName).to.equal(channelName);
    });

    it(`should use the passed headersToCheck`, function() {
      const headersToCheck = [
        'hello-1',
        'hello-2',
      ];
      const bcu = new BroadcastCacheUpdate({headersToCheck});
      expect(bcu._headersToCheck).to.equal(headersToCheck);
    });

    it(`should use the passed deferNoticationTimeout`, function() {
      const deferNoticationTimeout = 42;
      const bcu = new BroadcastCacheUpdate({deferNoticationTimeout});
      expect(bcu._deferNoticationTimeout).to.equal(deferNoticationTimeout);
    });

    it(`should use the default channelName when not passed`, function() {
      const bcu = new BroadcastCacheUpdate();
      expect(bcu._channelName).to.equal(DEFAULT_BROADCAST_CHANNEL_NAME);
    });

    it(`should use the default headersToCheck when not passed`, function() {
      const bcu = new BroadcastCacheUpdate();
      expect(bcu._headersToCheck).to.deep.equal(DEFAULT_HEADERS_TO_CHECK);
    });

    it(`should use the default headersToCheck when not passed`, function() {
      const bcu = new BroadcastCacheUpdate();
      expect(bcu._deferNoticationTimeout).to.equal(
          DEFAULT_DEFER_NOTIFICATION_TIMEOUT);
    });

    it(`adds a deferreds mapping for navigation fetch events`, () => {
      const bcu = new BroadcastCacheUpdate();
      expect(bcu._navigationEventsDeferreds).to.be.an.instanceof(Map);
    });

    it(`adds a message event listener that resolves deferreds`, () => {
      // Set a test timeout greater than the setTimeout below.
      this.timeout(1000);

      sandbox.spy(self, 'addEventListener');

      const bcu = new BroadcastCacheUpdate();
      expect(self.addEventListener.callCount).to.equal(1);

      const fetchEvent = new FetchEvent('fetch', {request: new Request('/')});
      const deferred = new Deferred();
      bcu._navigationEventsDeferreds.set(fetchEvent, deferred);

      setTimeout(() => {
        const messageEvent = new ExtendableMessageEvent('message', {
          data: {type: 'WINDOW_READY', meta: 'workbox-window'},
        });
        self.dispatchEvent(messageEvent);
      }, 100);

      // The message event should resolve this deferred's promise.
      return deferred.promise;
    });
  });

  describe(`notifyIfUpdated()`, function() {
    it(`should broadcast update if responses are different`, async function() {
      const bcu = new BroadcastCacheUpdate();
      const channel = bcu._getChannel();
      sandbox.spy(channel, 'postMessage');

      await bcu.notifyIfUpdated({
        oldResponse: new Response('', {
          headers: {'content-length': 0},
        }),
        newResponse: new Response('', {
          headers: {'content-length': 1},
        }),
        url: '/',
        cacheName: 'cache-name',
      });

      expect(channel.postMessage.callCount).to.equal(1);
      expect(channel.postMessage.args[0][0]).to.deep.equal({
        type: CACHE_UPDATED_MESSAGE_TYPE,
        meta: CACHE_UPDATED_MESSAGE_META,
        payload: {
          updatedURL: '/',
          cacheName: 'cache-name',
        },
      });
    });

    it(`should not broadcast update if responses are the same`, async function() {
      const bcu = new BroadcastCacheUpdate();
      const channel = bcu._getChannel();
      sandbox.spy(channel, 'postMessage');

      await bcu.notifyIfUpdated({
        oldResponse: new Response('', {
          headers: {'content-length': 0},
        }),
        newResponse: new Response('', {
          headers: {'content-length': 0},
        }),
        url: '/',
        cacheName: 'cache-name',
      });

      expect(channel.postMessage.callCount).to.equal(0);
    });

    it(`should postMessage window clients in browsers that don't support BroadcastChannel`, async function() {
      const OriginalBroadcastChannel = self.BroadcastChannel;
      delete self.BroadcastChannel;

      const bcu = new BroadcastCacheUpdate();

      const pm1Spy = sandbox.spy();
      const pm2Spy = sandbox.spy();
      sandbox.stub(self.clients, 'matchAll')
          .withArgs(sinon.match.has('type', 'window'))
          .resolves([{postMessage: pm1Spy}, {postMessage: pm2Spy}]);

      await bcu.notifyIfUpdated({
        oldResponse: new Response('', {
          headers: {'content-length': 0},
        }),
        newResponse: new Response('', {
          headers: {'content-length': 1},
        }),
        url: '/',
        cacheName: 'cache-name',
      });

      const expectData = {
        type: CACHE_UPDATED_MESSAGE_TYPE,
        meta: CACHE_UPDATED_MESSAGE_META,
        payload: {
          updatedURL: '/',
          cacheName: 'cache-name',
        },
      };

      expect(pm1Spy.callCount).to.equal(1);
      expect(pm1Spy.args[0][0]).to.deep.equal(expectData);
      expect(pm2Spy.callCount).to.equal(1);
      expect(pm2Spy.args[0][0]).to.deep.equal(expectData);

      if (OriginalBroadcastChannel) {
        self.BroadcastChannel = OriginalBroadcastChannel;
      }
    });

    it(`should not postMessage updates if responses are the same`, async function() {
      const OriginalBroadcastChannel = self.BroadcastChannel;
      delete self.BroadcastChannel;

      const bcu = new BroadcastCacheUpdate();

      const pm1Spy = sandbox.spy();
      const pm2Spy = sandbox.spy();
      sandbox.stub(self.clients, 'matchAll')
          .withArgs(sinon.match.has('type', 'window'))
          .resolves([{postMessage: pm1Spy}, {postMessage: pm2Spy}]);

      await bcu.notifyIfUpdated({
        oldResponse: new Response('', {
          headers: {'content-length': 0},
        }),
        newResponse: new Response('', {
          headers: {'content-length': 0},
        }),
        url: '/',
        cacheName: 'cache-name',
      });

      expect(pm1Spy.callCount).to.equal(0);
      expect(pm2Spy.callCount).to.equal(0);

      if (OriginalBroadcastChannel) {
        self.BroadcastChannel = OriginalBroadcastChannel;
      }
    });

    it(`should wait to broadcast on navigation requests`, function() {
      const bcu = new BroadcastCacheUpdate();

      sandbox.spy(bcu._getChannel(), 'postMessage');
      sandbox.spy(bcu, '_windowReadyOrTimeout');

      bcu.notifyIfUpdated({
        oldResponse: new Response('', {
          headers: {'content-length': 0},
        }),
        newResponse: new Response('', {
          headers: {'content-length': 1},
        }),
        url: '/',
        cacheName: 'cache-name',
      });

      expect(bcu._getChannel().postMessage.callCount).to.equal(1);
      expect(bcu._windowReadyOrTimeout.callCount).to.equal(0);

      // Stub a navigation request.
      const request = new Request('/');
      Object.defineProperty(request, 'mode', {value: 'navigate'});

      bcu.notifyIfUpdated({
        oldResponse: new Response('', {
          headers: {'content-length': 0},
        }),
        newResponse: new Response('', {
          headers: {'content-length': 1},
        }),
        url: '/',
        cacheName: 'cache-name',
        event: new FetchEvent('fetch', {request}),
      });

      expect(bcu._windowReadyOrTimeout.callCount).to.equal(1);

      // Fake receiving a message event from the window.
      setTimeout(() => {
        const messageEvent = new ExtendableMessageEvent('message', {
          data: {type: 'WINDOW_READY', meta: 'workbox-window'},
        });
        self.dispatchEvent(messageEvent);
      }, 0);

      return waitUntil(() => bcu._getChannel().postMessage.callCount === 2);
    });
  });

  describe(`_getChannel`, function() {
    it(`should not create more than one channel per instance`, function() {
      const channelName = 'channel-name';
      const bcu = new BroadcastCacheUpdate({channelName});
      const broadcastChannel = bcu._getChannel();
      expect(broadcastChannel).to.be.instanceof(BroadcastChannel);

      // bcu._getChannel() is a getter that create a BroadcastChannel the first
      // time it's called, and this test confirms that it returns the same
      // BroadcastChannel object when called twice.
      expect(broadcastChannel).to.eql(bcu._getChannel());
      expect(broadcastChannel.name).to.equal(channelName);
    });

    it(`should return undefined if BroadcastChannel is not supported`, function() {
      const OriginalBroadcastChannel = self.BroadcastChannel;
      delete self.BroadcastChannel;

      const channelName = 'channel-name';
      const bcu = new BroadcastCacheUpdate({channelName});
      const broadcastChannel = bcu._getChannel();
      expect(broadcastChannel).to.be.undefined;

      if (OriginalBroadcastChannel) {
        self.BroadcastChannel = OriginalBroadcastChannel;
      }
    });
  });

  describe(`_windowReadyOrTimeout`, function() {
    it(`waits to resolve until receiving a message from the window`, function(done) {
      // Set a timeout less than DEFAULT_DEFER_NOTIFICATION_TIMEOUT
      this.timeout(DEFAULT_DEFER_NOTIFICATION_TIMEOUT / 2);

      const bcu = new BroadcastCacheUpdate();
      const spy = sinon.spy();

      bcu._windowReadyOrTimeout().then(spy);

      setTimeout(() => {
        const messageEvent = new ExtendableMessageEvent('message', {
          data: {type: 'WINDOW_READY', meta: 'workbox-window'},
        });
        self.dispatchEvent(messageEvent);

        setTimeout(() => {
          // The above `readyPromise` should resolve as soon as the `message`
          // event fires, so one macrotask later the spy should have run.
          expect(spy.callCount).to.equal(1);
          done();
        }, 0);
      }, 100);
    });

    it(`waits no longer than the deferNoticationTimeout amount`, function(done) {
      // Set a timeout greater than the `deferNoticationTimeout` option below.
      this.timeout(1000);

      const bcu = new BroadcastCacheUpdate({deferNoticationTimeout: 100});

      bcu._windowReadyOrTimeout().then(done);
    });
  });
});
