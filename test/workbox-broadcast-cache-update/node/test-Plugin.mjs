/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

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
        const bcuPlugin = new Plugin();
        const oldResponse = new Response();
        const newResponse = new Response();
        bcuPlugin.cacheDidUpdate({oldResponse, newResponse});
      }, 'incorrect-type');
    });

    devOnly.it(`should throw when called and newResponse is missing`, function() {
      return expectError(() => {
        const bcuPlugin = new Plugin();
        const cacheName = 'cache-name';
        const oldResponse = new Response();
        bcuPlugin.cacheDidUpdate({cacheName, oldResponse});
      }, 'incorrect-class');
    });

    it(`should not throw when called with valid parameters`, function() {
      const bcuPlugin = new Plugin();
      sandbox.spy(bcuPlugin._broadcastUpdate, 'notifyIfUpdated');

      const cacheName = 'cache-name';
      const request = new Request('/');
      const oldResponse = new Response();
      const newResponse = new Response();
      bcuPlugin.cacheDidUpdate({cacheName, oldResponse, newResponse, request});

      expect(bcuPlugin._broadcastUpdate.notifyIfUpdated.callCount).to.equal(1);
    });

    it(`should notify and pass all options`, function() {
      const bcuPlugin = new Plugin();
      sandbox.spy(bcuPlugin._broadcastUpdate, 'notifyIfUpdated');

      const cacheName = 'cache-name';
      const request = new Request('/');
      const newResponse = new Response();
      const oldResponse = new Response();
      const event = new FetchEvent('fetch', {request});

      bcuPlugin.cacheDidUpdate({
        cacheName,
        newResponse,
        oldResponse,
        request,
        event,
      });

      expect(bcuPlugin._broadcastUpdate.notifyIfUpdated.callCount).to.equal(1);
      expect(bcuPlugin._broadcastUpdate.notifyIfUpdated.args[0][0]).to.deep.equal({
        cacheName,
        newResponse,
        oldResponse,
        event,
        url: request.url,
      });
    });

    it(`should not notify when no oldResponse supplied`, function() {
      const bcuPlugin = new Plugin();
      sandbox.spy(bcuPlugin._broadcastUpdate, 'notifyIfUpdated');

      const cacheName = 'cache-name';
      const request = new Request('/');
      const newResponse = new Response();
      bcuPlugin.cacheDidUpdate({cacheName, newResponse, request});

      expect(bcuPlugin._broadcastUpdate.notifyIfUpdated.callCount).to.equal(0);
    });
  });
});
