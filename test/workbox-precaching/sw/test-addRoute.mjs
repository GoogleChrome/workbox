/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {addRoute} from 'workbox-precaching/addRoute.mjs';
import {resetDefaultPrecacheController} from './resetDefaultPrecacheController.mjs';

describe(`addRoute()`, function () {
  const sandbox = sinon.createSandbox();

  function getAddedFetchListeners() {
    return self.addEventListener.args.filter(([type]) => type === 'fetch');
  }

  beforeEach(async function () {
    sandbox.restore();
    resetDefaultPrecacheController();

    // Spy on all added event listeners so they can be removed.
    sandbox.spy(self, 'addEventListener');
  });

  afterEach(function () {
    for (const args of self.addEventListener.args) {
      self.removeEventListener(...args);
    }
    sandbox.restore();
  });

  it(`should add at most 1 fetch listener`, async function () {
    addRoute();

    const callCountAfterFirstCall = getAddedFetchListeners().length;

    // Depending on the order of when tests run, this will be 0 or 1.
    expect(callCountAfterFirstCall).to.be.oneOf([0, 1]);

    addRoute();
    addRoute();
    addRoute();

    expect(getAddedFetchListeners().length).to.equal(callCountAfterFirstCall);
  });
});
