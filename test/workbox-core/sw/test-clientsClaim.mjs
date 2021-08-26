/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {clientsClaim} from 'workbox-core/clientsClaim.mjs';

describe(`clientsClaim`, function () {
  const sandbox = sinon.createSandbox();

  afterEach(function () {
    sandbox.restore();
  });

  it(`should add an activate event listener that calls clientsClaim`, function () {
    const clientsClaimSpy = sandbox.stub(self.clients, 'claim');

    sandbox.stub(self, 'addEventListener').callsFake((eventName, cb) => {
      expect(eventName).to.equal('activate');
      cb();
      expect(clientsClaimSpy.callCount).to.equal(1);
    });

    clientsClaim();
  });
});
