/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {logger} from 'workbox-core/_private/logger.mjs';
import {printCleanupDetails} from 'workbox-precaching/utils/printCleanupDetails.mjs';

describe(`printCleanupDetails()`, function () {
  const sandbox = sinon.createSandbox();

  beforeEach(function () {
    if (logger) {
      sandbox.spy(logger, 'log');
    }
  });

  afterEach(function () {
    sandbox.restore();
  });

  it(`shouldn't print if nothing was deleted`, function () {
    if (process.env.NODE_ENV === 'production') this.skip();

    printCleanupDetails([], []);

    expect(logger.log.callCount).to.equal(0);
  });

  it(`should print at least one entry was delete`, function () {
    if (process.env.NODE_ENV === 'production') this.skip();

    printCleanupDetails(['/'], ['/']);

    expect(logger.log.callCount).to.be.gt(0);
  });

  it(`should print strings with multiple entries`, function () {
    if (process.env.NODE_ENV === 'production') this.skip();

    printCleanupDetails(['/', '/2'], ['/', '/2']);

    expect(logger.log.callCount).to.be.gt(0);
  });
});
