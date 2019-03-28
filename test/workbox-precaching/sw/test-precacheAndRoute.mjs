/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {precacheAndRoute} from 'workbox-precaching/precacheAndRoute.mjs';


describe(`precacheAndRoute()`, function() {
  const sandbox = sinon.createSandbox();

  beforeEach(async function() {
    sandbox.restore();

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

  it(`should call precache() and addRoute()`, function() {
    precacheAndRoute(['/one']);

    // If `addRoute()` was run before `precacheAndRoute()` in the tests, then
    // the fetch listener will have already been added.
    expect(self.addEventListener.callCount).to.be.oneOf([2, 3]);
    expect(self.addEventListener.args[0][0]).to.equal('install');
    expect(self.addEventListener.args[1][0]).to.equal('activate');

    if (self.addEventListener.callCount === 3) {
      expect(self.addEventListener.args[2][0]).to.equal('fetch');
    }
  });
});
