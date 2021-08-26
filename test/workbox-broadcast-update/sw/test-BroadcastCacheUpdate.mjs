/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {BroadcastCacheUpdate} from 'workbox-broadcast-update/BroadcastCacheUpdate.mjs';
import {
  CACHE_UPDATED_MESSAGE_META,
  CACHE_UPDATED_MESSAGE_TYPE,
  DEFAULT_HEADERS_TO_CHECK,
} from 'workbox-broadcast-update/utils/constants.mjs';

describe(`BroadcastCacheUpdate`, function () {
  const sandbox = sinon.createSandbox();

  beforeEach(function () {
    sandbox.restore();
  });

  after(function () {
    sandbox.restore();
  });

  describe(`constructor()`, function () {
    it(`should use the passed headersToCheck`, function () {
      const headersToCheck = ['hello-1', 'hello-2'];
      const bcu = new BroadcastCacheUpdate({headersToCheck});
      expect(bcu._headersToCheck).to.equal(headersToCheck);
    });

    it(`should use the default headersToCheck when not passed`, function () {
      const bcu = new BroadcastCacheUpdate();
      expect(bcu._headersToCheck).to.deep.equal(DEFAULT_HEADERS_TO_CHECK);
    });

    it(`should use the passed generatePayload`, function () {
      const generatePayload = () => {};
      const bcu = new BroadcastCacheUpdate({generatePayload});
      expect(bcu._generatePayload).to.equal(generatePayload);
    });

    it(`should use the default generatePayload when not passed`, function () {
      const bcu = new BroadcastCacheUpdate();
      expect(bcu._generatePayload).to.be.a('function');
    });
  });

  describe(`notifyIfUpdated()`, function () {
    it(`should broadcast update if responses are different`, async function () {
      const bcu = new BroadcastCacheUpdate();

      const pm1Spy = sandbox.spy();
      const pm2Spy = sandbox.spy();
      sandbox
        .stub(self.clients, 'matchAll')
        .withArgs(sinon.match.has('type', 'window'))
        .resolves([{postMessage: pm1Spy}, {postMessage: pm2Spy}]);

      await bcu.notifyIfUpdated({
        oldResponse: new Response('', {
          headers: {'content-length': 0},
        }),
        newResponse: new Response('', {
          headers: {'content-length': 1},
        }),
        request: new Request('/'),
        cacheName: 'cache-name',
      });

      const expectData = {
        type: CACHE_UPDATED_MESSAGE_TYPE,
        meta: CACHE_UPDATED_MESSAGE_META,
        payload: {
          updatedURL: new URL('/', location).href,
          cacheName: 'cache-name',
        },
      };

      expect(pm1Spy.callCount).to.equal(1);
      expect(pm1Spy.args[0][0]).to.deep.equal(expectData);
      expect(pm2Spy.callCount).to.equal(1);
      expect(pm2Spy.args[0][0]).to.deep.equal(expectData);
    });

    it(`should not broadcast update if responses are the same`, async function () {
      const bcu = new BroadcastCacheUpdate();

      const pm1Spy = sandbox.spy();
      const pm2Spy = sandbox.spy();
      sandbox
        .stub(self.clients, 'matchAll')
        .withArgs(sinon.match.has('type', 'window'))
        .resolves([{postMessage: pm1Spy}, {postMessage: pm2Spy}]);

      await bcu.notifyIfUpdated({
        oldResponse: new Response('', {
          headers: {'content-length': 0},
        }),
        newResponse: new Response('', {
          headers: {'content-length': 0},
        }),
        request: new Request('/'),
        cacheName: 'cache-name',
      });

      expect(pm1Spy.callCount).to.equal(0);
      expect(pm2Spy.callCount).to.equal(0);
    });

    it(`should throw when called and cacheName is missing`, function () {
      if (process.env.NODE_ENV === 'production') this.skip();

      return expectError(async () => {
        const bcu = new BroadcastCacheUpdate();
        const oldResponse = new Response();
        const newResponse = new Response();
        const request = new Request('/');
        await bcu.notifyIfUpdated({oldResponse, newResponse, request});
      }, 'incorrect-type');
    });

    it(`should throw when called and newResponse is missing`, function () {
      if (process.env.NODE_ENV === 'production') this.skip();

      return expectError(async () => {
        const bcu = new BroadcastCacheUpdate();
        const cacheName = 'cache-name';
        const oldResponse = new Response();
        const request = new Request('/');
        await bcu.notifyIfUpdated({cacheName, oldResponse, request});
      }, 'incorrect-class');
    });

    it(`should throw when called and request is missing`, function () {
      if (process.env.NODE_ENV === 'production') this.skip();

      return expectError(async () => {
        const bcu = new BroadcastCacheUpdate();
        const cacheName = 'cache-name';
        const oldResponse = new Response();
        const newResponse = new Response();
        await bcu.notifyIfUpdated({cacheName, oldResponse, newResponse});
      }, 'incorrect-class');
    });
  });
});
