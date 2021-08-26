/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {setDefaultHandler} from 'workbox-routing/setDefaultHandler.mjs';
import {getOrCreateDefaultRouter} from 'workbox-routing/utils/getOrCreateDefaultRouter.mjs';

describe(`setDefaultHandler()`, function () {
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

  it(`should call setDefaultHandler() on the default router`, function () {
    sandbox.stub(defaultRouter, 'setDefaultHandler');

    const handler = sandbox.spy();
    setDefaultHandler(handler);

    expect(defaultRouter.setDefaultHandler.callCount).to.equal(1);
    expect(defaultRouter.setDefaultHandler.args[0][0]).to.equal(handler);
  });
});
