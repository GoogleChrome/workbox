/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {expect} from 'chai';
import {reset as iDBReset} from 'shelving-mock-indexeddb';
import sinon from 'sinon';
import {Queue} from '../../../packages/workbox-background-sync/Queue.mjs';
import {Plugin} from '../../../packages/workbox-background-sync/Plugin.mjs';

describe(`[workbox-background-sync] Plugin`, function() {
  const sandbox = sinon.createSandbox();

  const reset = () => {
    sandbox.restore();
    Queue._queueNames.clear();
    iDBReset();
  };

  beforeEach(async function() {
    reset();
  });

  after(async function() {
    reset();
  });

  describe(`constructor`, function() {
    it(`should store a Queue instance`, async function() {
      const queuePlugin = new Plugin('foo');
      expect(queuePlugin._queue).to.be.instanceOf(Queue);
    });

    it(`should implement fetchDidFail and add requests to the queue`, async function() {
      const stub = sandbox.stub(Queue.prototype, 'pushRequest');
      const queuePlugin = new Plugin('foo');

      queuePlugin.fetchDidFail({request: new Request('/one')});
      expect(stub.callCount).to.equal(1);
      expect(stub.args[0][0].request.url).to.equal('/one');
      expect(stub.args[0][0].request).to.be.instanceOf(Request);
    });
  });
});
