/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {logger} from 'workbox-core/_private/logger.mjs';
import {skipWaiting} from 'workbox-core/skipWaiting.mjs';

describe(`skipWaiting`, function () {
  const sandbox = sinon.createSandbox();

  afterEach(function () {
    sandbox.restore();
  });

  it(`should call self.skipWaiting()`, function () {
    const skipWaitingStub = sandbox.stub(self, 'skipWaiting');

    skipWaiting();

    expect(skipWaitingStub.callCount).to.eql(1);
  });

  it(`should log a warning message in development`, function () {
    if (process.env.NODE_ENV === 'production') {
      this.skip();
    }

    const warnStub = sandbox.stub(logger, 'warn');
    const skipWaitingStub = sandbox.stub(self, 'skipWaiting');

    skipWaiting();

    expect(skipWaitingStub.callCount).to.eql(1);
    expect(warnStub.callCount).to.eql(1);
  });
});
