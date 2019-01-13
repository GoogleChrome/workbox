/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import sinon from 'sinon';
import {expect} from 'chai';
import clearRequire from 'clear-require';


describe(`[workbox-precaching] default export`, function() {
  const sandbox = sinon.createSandbox();
  let precache;
  let addPlugins;
  let PrecacheController;

  beforeEach(async function() {
    sandbox.restore();

    const basePath = '../../../packages/workbox-precaching/';

    // Clear the require cache and then re-import needed modules to assure
    // local variables are reset before each run.
    clearRequire.match(new RegExp('workbox-precaching'));
    addPlugins = (await import(`${basePath}addPlugins.mjs`)).addPlugins;
    precache = (await import(`${basePath}precache.mjs`)).precache;
    PrecacheController = (await import(`${basePath}PrecacheController.mjs`)).PrecacheController;
  });

  after(function() {
    sandbox.restore();
  });

  describe(`addPlugins()`, function() {
    it(`should add plugins during install and activate`, async function() {
      let eventCallbacks = {};
      sandbox.stub(self, 'addEventListener').callsFake((eventName, cb) => {
        eventCallbacks[eventName] = cb;
      });
      sandbox.spy(PrecacheController.prototype, 'install');
      sandbox.spy(PrecacheController.prototype, 'activate');

      const precacheArgs = ['/'];

      const plugin1 = {
        name: 'plugin1',
      };
      const plugin2 = {
        name: 'plugin2',
      };

      precache(precacheArgs);

      addPlugins([plugin1]);
      addPlugins([plugin2]);

      const installEvent = new ExtendableEvent('install');
      let installPromise;
      installEvent.waitUntil = (promise) => {
        installPromise = promise;
      };
      eventCallbacks['install'](installEvent);

      await installPromise;

      expect(PrecacheController.prototype.install.args[0][0].plugins).to.deep.equal([
        plugin1,
        plugin2,
      ]);

      const activateEvent = new ExtendableEvent('activate');
      let activatePromise;
      activateEvent.waitUntil = (promise) => {
        activatePromise = promise;
      };
      eventCallbacks['activate'](activateEvent);

      await activatePromise;

      expect(PrecacheController.prototype.activate.args[0][0].plugins).to.deep.equal([
        plugin1,
        plugin2,
      ]);
    });
  });
});
