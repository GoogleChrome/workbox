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

/* eslint-env mocha, browser */
/* global chai, workbox, sinon */

'use strict';
describe('request-manager test', () => {
  let responseAchieved = 0;
  const callbacks = {
    onResponse: function() {
      responseAchieved++;
    },
  };

  let queue;
  let reqManager;
  const idbHelper = new workbox.backgroundSync.test.IdbHelper(
    'bgQueueSyncDB', 1, 'QueueStore');

  before((done) => {
    const QUEUE_NAME = 'QUEUE_NAME';
    const MAX_AGE = 6;
    queue =
      new workbox.backgroundSync.test.RequestQueue({
        idbQDb: idbHelper,
        config: {maxAge: MAX_AGE},
        queueName: QUEUE_NAME,
      });
    reqManager = new workbox.backgroundSync.test.RequestManager({
      callbacks,
      queue,
    });
    done();
  });

  let globalStubs = [];
  afterEach(function() {
    globalStubs.forEach((stub) => stub.restore());
    globalStubs = [];
  });


  it('check constructor', () => {
    chai.assert.isObject(reqManager);
    chai.assert.isFunction(reqManager.attachSyncHandler);
    chai.assert.isFunction(reqManager.replayRequest);
    chai.assert.isFunction(reqManager.replayRequests);

    chai.assert.equal(reqManager._globalCallbacks, callbacks);
    chai.assert.equal(reqManager._queue, queue);
  });

  it('check replay', async function() {
    const backgroundSyncQueue
      = new workbox.backgroundSync.test.BackgroundSyncQueue({
      callbacks,
    });
    await backgroundSyncQueue.pushIntoQueue({request: new Request('/__echo/counter')});
    await backgroundSyncQueue.pushIntoQueue({request: new Request('/__echo/counter')});
    await backgroundSyncQueue._requestManager.replayRequests();
    chai.assert.equal(responseAchieved, 2);
  });

  it(`will fetch() the request returned by the RequestWrapper's requestWillFetch plugin`, async function() {
    const stub = sinon.stub(self, 'fetch').returns(new Response());
    globalStubs.push(stub);

    const expectedRequest = new Request('expected');
    const plugins = [{
      requestWillFetch: () => Promise.resolve(expectedRequest),
    }];
    const requestWrapper = new workbox.runtimeCaching.RequestWrapper({plugins});
    const bsq = new workbox.backgroundSync.test.BackgroundSyncQueue({
      callbacks,
      requestWrapper,
    });

    await bsq.pushIntoQueue({request: new Request('notexpected')});
    await bsq._requestManager.replayRequests();

    chai.expect(stub.getCall(0).args[0]).to.eql(expectedRequest);
  });
});
