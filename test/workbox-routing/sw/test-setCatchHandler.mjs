/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {setCatchHandler} from 'workbox-routing/setCatchHandler.mjs';
import {getOrCreateDefaultRouter} from 'workbox-routing/utils/getOrCreateDefaultRouter.mjs';

describe(`setCatchHandler()`, function () {
  const sandbox = sinon.createSandbox();
  let defaultRouter;

  beforeEach(async function () {
    sandbox.restore();

    // Spy on all added event listeners so they can be removed.
    sandbox.spy(self, 'addEventListener');

    defaultRouter = getOrCreateDefaultRouter();
  });

  afterEach(function () {
    for (const args of self.addEventListener.args) {
      self.removeEventListener(...args);
    }
    sandbox.restore();
  });

  it(`should call setCatchHandler() on the default router`, function () {
    sandbox.stub(defaultRouter, 'setCatchHandler');

    const handler = sandbox.spy();
    setCatchHandler(handler);

    expect(defaultRouter.setCatchHandler.callCount).to.equal(1);
    expect(defaultRouter.setCatchHandler.args[0][0]).to.equal(handler);
  });
});
