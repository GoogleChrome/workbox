/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {skipWaiting} from 'workbox-core/skipWaiting.mjs';


describe(`skipWaiting`, function() {
  const sandbox = sinon.createSandbox();

  after(function() {
    sandbox.restore();
  });

  it('should add an install event listener that calls skipWaiting', function(done) {
    const skipWaitingSpy = sandbox.spy(self, 'skipWaiting');

    sandbox.stub(self, 'addEventListener').callsFake((eventName, cb) => {
      expect(eventName).to.equal('install');

      cb();

      expect(skipWaitingSpy.callCount).to.equal(1);
      done();
    });

    skipWaiting();
  });
});
