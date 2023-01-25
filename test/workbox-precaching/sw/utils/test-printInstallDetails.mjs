/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {logger} from 'workbox-core/_private/logger.mjs';
import {printInstallDetails} from 'workbox-precaching/utils/printInstallDetails.mjs';

describe(`printInstallDetails()`, function () {
  const sandbox = sinon.createSandbox();

  beforeEach(function () {
    if (logger) {
      sandbox.spy(logger, 'log');
    }
  });

  afterEach(function () {
    sandbox.restore();
  });

  it(`should print with single update`, function () {
    if (process.env.NODE_ENV === 'production') this.skip();

    printInstallDetails([], ['/index.html']);

    expect(logger.log.callCount).to.equal(1);
  });
});
