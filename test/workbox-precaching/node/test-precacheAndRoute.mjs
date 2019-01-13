/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import sinon from 'sinon';
import {expect} from 'chai';
import clearRequire from 'clear-require';

describe(`[workbox-precaching] precacheAndRoute`, function() {
  const sandbox = sinon.createSandbox();
  let precacheAndRoute;
  let precache;
  let addRoute;

  beforeEach(async function() {
    sandbox.restore();

    const basePath = '../../../packages/workbox-precaching/';

    // Clear the require cache and then re-import needed modules to assure
    // local variables are reset before each run.
    clearRequire.match(new RegExp('workbox-precaching'));
    precacheAndRoute = (await import(`${basePath}precacheAndRoute.mjs`)).precacheAndRoute;
    precache = (await import(`${basePath}precache.mjs`)).precache;
    addRoute = (await import(`${basePath}addRoute.mjs`)).addRoute;
  });

  after(function() {
    sandbox.restore();
  });


  describe(`precacheAndRoute()`, function() {
    // TODO(philipwalton): the follow tests are copied from before #1830,
    // but the can't be tested in the same way because we can no longer spy on
    // the `precache()` and `addRoute()` functions. Find a way to test them.
    // it(`should call precache() and addRoute() without args`, function() {
    //   sandbox.stub(precaching, 'precache');
    //   sandbox.stub(precaching, 'addRoute');
    //   precacheAndRoute();
    //   expect(precaching.precache.callCount).to.equal(1);
    //   expect(precaching.precache.args[0]).to.deep.equal([undefined]);
    //   expect(precaching.addRoute.callCount).to.equal(1);
    //   expect(precaching.addRoute.args[0]).to.deep.equal([undefined]);
    // });
    // it(`should call precache() and addRoute() with args`, function() {
    //   sandbox.stub(precaching, 'precache');
    //   sandbox.stub(precaching, 'addRoute');
    //   const precacheArgs = ['/'];
    //   const routeOptions = {
    //     ignoreURLParametersMatching: [/utm_/],
    //     directoryIndex: 'example.html',
    //   };
    //   precacheAndRoute(precacheArgs, routeOptions);
    //   expect(precaching.precache.callCount).to.equal(1);
    //   expect(precaching.precache.args[0][0]).to.equal(precacheArgs);
    //   expect(precaching.addRoute.callCount).to.equal(1);
    //   expect(precaching.addRoute.args[0][0]).to.equal(routeOptions);
    // });

    it(`should call precache()`, function() {
      sandbox.stub(self, 'addEventListener');

      // Calling `precacheAndRoute()` should add 2 listeners
      // (install and activate).
      precacheAndRoute(['/one']);

      expect(self.addEventListener.callCount).to.equal(3);
      expect(self.addEventListener.args[0][0]).to.equal('install');
      expect(self.addEventListener.args[1][0]).to.equal('activate');
      expect(self.addEventListener.args[2][0]).to.equal('fetch');

      // If calling `precache()` doesn't add new listeners, it implies that
      // `precache()` already called `precache()`.
      precache(['/two']);

      expect(self.addEventListener.callCount).to.equal(3);
    });

    it(`should call addRoute()`, function() {
      sandbox.stub(self, 'addEventListener');

      // Calling `precacheAndRoute()` should add a fetch listener.
      precacheAndRoute(['/one']);

      expect(self.addEventListener.callCount).to.equal(3);
      expect(self.addEventListener.args[0][0]).to.equal('install');
      expect(self.addEventListener.args[1][0]).to.equal('activate');
      expect(self.addEventListener.args[2][0]).to.equal('fetch');

      // If calling `addRoute()` doesn't add new listeners, it implies that
      // `precacheAndRoute()` already called `addRoute()`.
      addRoute();

      expect(self.addEventListener.callCount).to.equal(3);
    });
  });
});
