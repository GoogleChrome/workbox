/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import sinon from 'sinon';
import {expect} from 'chai';
import clearRequire from 'clear-require';

describe(`[workbox-precaching] precache`, function() {
  const sandbox = sinon.createSandbox();
  let precache;
  let PrecacheController;

  beforeEach(async function() {
    sandbox.restore();

    const basePath = '../../../packages/workbox-precaching/';

    // Clear the require cache and then re-import needed modules to assure
    // local variables are reset before each run.
    clearRequire.match(new RegExp('workbox-precaching'));
    precache = (await import(`${basePath}precache.mjs`)).precache;
    PrecacheController = (await import(`${basePath}PrecacheController.mjs`)).PrecacheController;
  });

  after(function() {
    sandbox.restore();
  });

  describe(`precache()`, function() {
    it(`should call install and activate on install and activate`, async function() {
      const eventCallbacks = {};
      sandbox.stub(self, 'addEventListener').callsFake((eventName, cb) => {
        eventCallbacks[eventName] = cb;
      });
      sandbox.spy(PrecacheController.prototype, 'install');
      sandbox.spy(PrecacheController.prototype, 'activate');

      expect(PrecacheController.prototype.install.callCount).to.equal(0);

      precache(['/']);

      const installEvent = new ExtendableEvent('install');
      let controllerInstallPromise;
      installEvent.waitUntil = (promise) => {
        controllerInstallPromise = promise;
      };


      eventCallbacks['install'](installEvent);

      await controllerInstallPromise;
      expect(PrecacheController.prototype.install.callCount).to.equal(1);

      const activateEvent = new ExtendableEvent('activate');
      let controllerActivatePromise;
      activateEvent.waitUntil = (promise) => {
        controllerActivatePromise = promise;
      };
      eventCallbacks['activate'](installEvent);

      await controllerActivatePromise;
      expect(PrecacheController.prototype.activate.callCount).to.equal(1);
    });

    it(`shouldn't throw when precaching assets`, function() {
      precache([
        'index.1234.html',
        {
          url: 'test.1234.html',
        },
        {
          url: 'testing.html',
          revision: '1234',
        },
      ]);
    });
  });
});
