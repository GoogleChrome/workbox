/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {Plugin} from '../../../packages/workbox-broadcast-update/Plugin.mjs';


describe(`Plugin`, function() {
  const sandbox = sinon.createSandbox();

  beforeEach(function() {
    sandbox.restore();
  });

  after(function() {
    sandbox.restore();
  });

  describe(`cacheDidUpdate`, function() {
    it(`should throw when called and cacheName is missing`, function() {
      if (process.env.NODE_ENV === 'production') this.skip();

      return expectError(async () => {
        const bcuPlugin = new Plugin();
        const oldResponse = new Response();
        const newResponse = new Response();
        await bcuPlugin.cacheDidUpdate({oldResponse, newResponse});
      }, 'incorrect-type');
    });

    it(`should throw when called and newResponse is missing`, function() {
      if (process.env.NODE_ENV === 'production') this.skip();

      return expectError(async () => {
        const bcuPlugin = new Plugin();
        const cacheName = 'cache-name';
        const oldResponse = new Response();
        await bcuPlugin.cacheDidUpdate({cacheName, oldResponse});
      }, 'incorrect-class');
    });

    it(`should not throw when called with valid parameters`, async function() {
      const bcuPlugin = new Plugin();
      sandbox.spy(bcuPlugin._broadcastUpdate, 'notifyIfUpdated');

      const cacheName = 'cache-name';
      const request = new Request('/');
      const oldResponse = new Response();
      const newResponse = new Response();
      await bcuPlugin.cacheDidUpdate({cacheName, oldResponse, newResponse, request});

      expect(bcuPlugin._broadcastUpdate.notifyIfUpdated.callCount).to.equal(1);
    });

    it(`should notify and pass all options`, async function() {
      const bcuPlugin = new Plugin();
      sandbox.spy(bcuPlugin._broadcastUpdate, 'notifyIfUpdated');

      const cacheName = 'cache-name';
      const request = new Request('/');
      const newResponse = new Response();
      const oldResponse = new Response();
      const event = new FetchEvent('fetch', {request});

      await bcuPlugin.cacheDidUpdate({
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

    it(`should not notify when no oldResponse supplied`, async function() {
      const bcuPlugin = new Plugin();
      sandbox.spy(bcuPlugin._broadcastUpdate, 'notifyIfUpdated');

      const cacheName = 'cache-name';
      const request = new Request('/');
      const newResponse = new Response();
      await bcuPlugin.cacheDidUpdate({cacheName, newResponse, request});

      expect(bcuPlugin._broadcastUpdate.notifyIfUpdated.callCount).to.equal(0);
    });
  });
});
