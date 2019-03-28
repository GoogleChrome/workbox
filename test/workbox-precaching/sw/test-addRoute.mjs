/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {addRoute} from 'workbox-precaching/addRoute.mjs';


describe(`addRoute()`, function() {
  const sandbox = sinon.createSandbox();

  beforeEach(async function() {
    sandbox.restore();

    // Spy on all added event listeners so they can be removed.
    sandbox.spy(self, 'addEventListener');
  });

  afterEach(function() {
    for (const args of self.addEventListener.args) {
      self.removeEventListener(...args);
    }
    sandbox.restore();
  });

  it(`should add at most 1 fetch listener`, async function() {
    addRoute();

    const callCountAfterFirstCall = self.addEventListener.callCount;

    // Depending on the order of when tests run, this will be 0 or 1.
    expect(callCountAfterFirstCall).to.be.oneOf([0, 1]);

    addRoute();
    addRoute();
    addRoute();

    expect(self.addEventListener.callCount).to.equal(callCountAfterFirstCall);
  });
});
