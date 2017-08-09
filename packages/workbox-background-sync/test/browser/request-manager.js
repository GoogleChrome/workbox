/*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

import IDBHelper from '../../../../lib/idb-helper.js';
import {defaultDBName} from '../../src/lib/constants.js';
import BackgroundSyncQueue from '../../src/lib/background-sync-queue.js';
import RequestManager from '../../src/lib/request-manager.js';
import RequestQueue from '../../src/lib/request-queue.js';

describe(`request-manager `, function() {
  const callbacks = {};
  let queue;
  let reqManager;

  const idbHelper = new IDBHelper(defaultDBName, 1, 'QueueStore');

  before(function(done) {
    const QUEUE_NAME = 'QUEUE_NAME';
    const MAX_AGE = 6;
    queue = new RequestQueue({
      idbQDb: idbHelper,
      config: {maxAge: MAX_AGE},
      queueName: QUEUE_NAME,
    });
    reqManager = new RequestManager({callbacks, queue});
    done();
  });

  describe(`constructor`, function() {
    it(`should initialize private methods with the given values iin constructor`, function() {
      expect(reqManager).to.be.an('object');
      expect(reqManager.attachSyncHandler).to.be.a('function');
      expect(reqManager.replayRequest).to.be.a('function');
      expect(reqManager.replayRequests).to.be.a('function');

      expect(reqManager._globalCallbacks).to.equal(callbacks);
      expect(reqManager._queue).to.equal(queue);
    });
  });

  describe(`replay method`, function() {
    it(`should replay all queued request via replay method`, async function() {
      sinon.spy(self, 'fetch');

      callbacks.replayDidSucceed = sinon.spy();
      callbacks.replayDidFail = sinon.spy();

    const backgroundSyncQueue = new BackgroundSyncQueue({callbacks});

    await backgroundSyncQueue.pushIntoQueue({
      request: new Request('/__echo/counter'),
    });
    await backgroundSyncQueue.pushIntoQueue({
      request: new Request('/__echo/counter'),
    });
    await backgroundSyncQueue._requestManager.replayRequests();

      // Asset replayDidSucceed callback was called with the correct arguments.
      expect(callbacks.replayDidSucceed.callCount).to.equal(2);
      expect(callbacks.replayDidSucceed.alwaysCalledWith(
          sinon.match.string, sinon.match.instanceOf(Response))).to.be.true;

      // Assert fetch was called for each replayed request.
      expect(self.fetch.calledTwice).to.be.true;

    await backgroundSyncQueue.pushIntoQueue({
      request: new Request('/__test/404'),
    });
    try {
      await backgroundSyncQueue._requestManager.replayRequests();
    } catch (err) {
      // Error is expected due to 404 response.
    }

      // Asset replayDidFail callback was called with the correct arguments.
      expect(callbacks.replayDidSucceed.callCount).to.equal(2);
      expect(callbacks.replayDidFail.callCount).to.equal(1);
      expect(callbacks.replayDidFail.alwaysCalledWith(
          sinon.match.string, sinon.match.instanceOf(Response))).to.be.ok;

      delete callbacks.replayDidSucceed;
      delete callbacks.replayDidFail;

      self.fetch.restore();
    });
  });
});
