/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {timeout} from 'workbox-core/_private/timeout.mjs';

describe(`timeout()`, function () {
  const sandbox = sinon.createSandbox();

  beforeEach(async function () {
    sandbox.restore();
  });

  afterEach(function () {
    sandbox.restore();
  });

  it(`should return a promise that resolves after the passed number of milliseconds`, function (done) {
    const clock = sandbox.useFakeTimers();
    const startTime = performance.now();

    timeout(123).then(() => {
      expect(performance.now() - startTime).to.equal(123);
      clock.tick(456);
    });

    timeout(456).then(() => {
      expect(performance.now() - startTime).to.equal(123 + 456);
      done();
    });

    clock.tick(123);
  });
});
