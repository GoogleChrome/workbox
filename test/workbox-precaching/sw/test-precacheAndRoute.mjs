/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {precacheAndRoute} from 'workbox-precaching/precacheAndRoute.mjs';
import {PrecacheController} from 'workbox-precaching/PrecacheController.mjs';
import {resetDefaultPrecacheController} from './resetDefaultPrecacheController.mjs';


describe(`precacheAndRoute()`, function() {
  const sandbox = sinon.createSandbox();

  beforeEach(async function() {
    sandbox.restore();
    resetDefaultPrecacheController();

    // Spy on all added event listeners so they can be removed.
    sandbox.spy(self, 'addEventListener');
  });

  // The `addFetchListener` method adds a listener only the first time it's invoked,
  // so we can't remove that listener until all tests are run.
  afterEach(function() {
    for (const args of self.addEventListener.args) {
      self.removeEventListener(...args);
    }
    sandbox.restore();
  });

  it(`should call precache() and addRoute() without args`, function() {
    const precache = sandbox.stub(PrecacheController.prototype, 'precache');
    const addRoute = sandbox.stub(PrecacheController.prototype, 'addRoute');

    precacheAndRoute();
    expect(precache.callCount).to.equal(1);
    expect(precache.args[0]).to.deep.equal([undefined]);
    expect(addRoute.callCount).to.equal(1);
    expect(addRoute.args[0]).to.deep.equal([undefined]);
  });

  it(`should call precache() and addRoute() with args`, function() {
    const precache = sandbox.stub(PrecacheController.prototype, 'precache');
    const addRoute = sandbox.stub(PrecacheController.prototype, 'addRoute');

    const precacheArgs = ['/'];
    const routeOptions = {
      ignoreURLParametersMatching: [/utm_/],
      directoryIndex: 'example.html',
    };

    precacheAndRoute(precacheArgs, routeOptions);
    expect(precache.callCount).to.equal(1);
    expect(precache.args[0][0]).to.equal(precacheArgs);
    expect(addRoute.callCount).to.equal(1);
    expect(addRoute.args[0][0]).to.equal(routeOptions);
  });
});
