import * as sinon from 'sinon';
import {expect} from 'chai';

import expectError from '../../../infra/testing/expectError';
import {devOnly} from '../../../infra/testing/env-it';

import {Plugin} from '../../../packages/workbox-broadcast-cache-update/Plugin.mjs';

describe(`[workbox-broadcast-cache-udpate] Plugin`, function() {
  const sandbox = sinon.createSandbox();

  beforeEach(function() {
    sandbox.restore();
  });

  after(function() {
    sandbox.restore();
  });

  describe(`cacheDidUpdate`, function() {
    devOnly.it(`should throw when called and cacheName is missing`, function() {
      return expectError(() => {
        const bcuPlugin = new Plugin('channel-name');
        const oldResponse = new Response();
        const newResponse = new Response();
        bcuPlugin.cacheDidUpdate({oldResponse, newResponse});
      }, 'incorrect-type');
    });

    devOnly.it(`should throw when called and newResponse is missing`, function() {
      return expectError(() => {
        const bcuPlugin = new Plugin('channel-name');
        const cacheName = 'cache-name';
        const oldResponse = new Response();
        bcuPlugin.cacheDidUpdate({cacheName, oldResponse});
      }, 'incorrect-class');
    });

    it(`should not throw when called with valid parameters`, function() {
      const bcuPlugin = new Plugin('channel-name');
      sandbox.spy(bcuPlugin._broadcastUpdate, 'notifyIfUpdated');

      const cacheName = 'cache-name';
      const request = new Request('/');
      const oldResponse = new Response();
      const newResponse = new Response();
      bcuPlugin.cacheDidUpdate({cacheName, oldResponse, newResponse, request});

      expect(bcuPlugin._broadcastUpdate.notifyIfUpdated.callCount).to.equal(1);
    });

    it(`should not notify when no oldResponse supplied`, function() {
      const bcuPlugin = new Plugin('channel-name');
      sandbox.spy(bcuPlugin._broadcastUpdate, 'notifyIfUpdated');

      const cacheName = 'cache-name';
      const request = new Request('/');
      const newResponse = new Response();
      bcuPlugin.cacheDidUpdate({cacheName, newResponse, request});

      expect(bcuPlugin._broadcastUpdate.notifyIfUpdated.callCount).to.equal(0);
    });
  });
});
