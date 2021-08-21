/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {Queue} from 'workbox-background-sync/Queue.mjs';
import {BackgroundSyncPlugin} from 'workbox-background-sync/BackgroundSyncPlugin.mjs';

let count = 0;
function getUniqueQueueName() {
  return `queue-${count++}`;
}

describe(`BackgroundSyncPlugin`, function () {
  const sandbox = sinon.createSandbox();

  beforeEach(async function () {
    // Don't actually register for a sync event in any test, as it could
    // make the tests non-deterministic.
    if ('sync' in registration) {
      sandbox.stub(registration.sync, 'register');
    }
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe(`constructor`, function () {
    it(`should implement fetchDidFail and add requests to the queue`, async function () {
      const stub = sandbox.stub(Queue.prototype, 'pushRequest');
      const queuePlugin = new BackgroundSyncPlugin(getUniqueQueueName());

      queuePlugin.fetchDidFail({request: new Request('/one')});
      expect(stub.callCount).to.equal(1);
      expect(stub.args[0][0].request.url).to.equal(`${location.origin}/one`);
      expect(stub.args[0][0].request).to.be.instanceOf(Request);
    });
  });
});
