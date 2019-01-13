/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {expect} from 'chai';
import sinon from 'sinon';
import {clientsClaim} from '../../../packages/workbox-core/clientsClaim.mjs';


describe(`[workbox-core] clientsClaim`, function() {
  let sandbox = sinon.createSandbox();

  beforeEach(function() {
    sandbox.restore();
  });

  after(function() {
    sandbox.restore();
  });

  describe(`clientsClaim`, function() {
    it('should add an activate event listener that calls clientsClaim', function(done) {
      const clientsClaimSpy = sandbox.spy(self.clients, 'claim');

      sandbox.stub(self, 'addEventListener').callsFake((eventName, cb) => {
        expect(eventName).to.equal('activate');

        cb();

        expect(clientsClaimSpy.callCount).to.equal(1);
        done();
      });

      clientsClaim();
    });
  });
});
