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
import * as Constants from '../../src/lib/constants.js';
import RequestQueue from '../../src/lib/request-queue.js';

describe(`request-queue`, function() {
  const QUEUE_NAME = 'QUEUE_NAME';
  const MAX_AGE = 6;

  const callbacks = {};
  const db = new IDBHelper(Constants.defaultDBName, 1, 'QueueStore');
  const queue = new RequestQueue({
    idbQDb: db,
    config: {maxAge: MAX_AGE},
    queueName: QUEUE_NAME,
    callbacks,
  });

  const resetDb = async function() {
    const keys = await db.getAllKeys();
    return Promise.all(keys.map((key) => db.delete(key)));
  };

  before(resetDb);
  afterEach(resetDb);

  describe(`constructor`, function() {
    it(`should initialize with correct object types`, function() {
      expect(queue).to.be.an('object');
      expect(queue._queue).to.be.an('array');
      expect(queue._queueName).to.be.a('string');
      expect(queue._config).to.be.an('object');
    });

    it(`should should not fail for null data`, async function() {
      expect(queue._queue.length).to.equal(0);
      db.put(queue._queueName, null);
      await queue.initQueue();
      expect(queue._queue.length).to.equal(0);
    });

    it(`should re-fill the queue`, async function() {
      expect(queue._queue.length).to.equal(0);
      const hash = await queue.pushIntoQueue({
        request: new Request('http://lipsum.com/generate'),
      });
      expect(queue._queue.length).to.equal(1);
      queue._queue = [];
      expect(queue._queue.length).to.equal(0);
      await queue.initQueue();
      expect(queue._queue.length).to.equal(1);
      expect(queue._queue[0]).to.equal(hash);
    });

    it(`should fill the queueName correctly`, function() {
      expect(queue._queueName).to.equal(QUEUE_NAME);
    });

    it(`should configure correctly`, function() {
      expect(queue._config.maxAge).to.equal(MAX_AGE);
      expect(queue._config.maxAge).to.not
          .equal(Constants.maxAge);
    });

    it(`should configure correctly without any optional parameters given`, function() {
      let tempQueue = new RequestQueue({
        idbQDb: db,
      });
      let tempQueue2 = new RequestQueue({
        idbQDb: db,
      });
      expect(tempQueue._config).to.equal(undefined);
      expect(tempQueue._queueName).to.match(
        new RegExp(Constants.defaultQueueName + '_\\d+'));
      expect(tempQueue2._queueName).to.match(
        new RegExp(Constants.defaultQueueName + '_\\d+'));
    });
  });

  describe(`push method`, function() {
    it(`should push the given Request in the private array`, async function() {
      callbacks.requestWillEnqueue = sinon.spy();
      const spy = sinon.spy(queue, 'getQueue');
      const queueLength = queue._queue.length;
      const hash = await queue.pushIntoQueue({
        request: new Request('http://lipsum.com/generate'),
      });

      expect(hash).to.be.a('string');
      expect(queue._queue.length).to.equal(queueLength + 1);

      expect(callbacks.requestWillEnqueue.calledOnce).to.be.true;
      expect(spy.called).to.be.true;
      queue.getQueue.restore();
      expect(callbacks.requestWillEnqueue.calledWith(sinon.match.has('request')))
          .to.be.true;
      delete callbacks.requestWillEnqueue;
    });
  });

  describe(`getRequestFromQueue method`, function() {
    it(`should get the proper Request back`, async function() {
      callbacks.requestWillDequeue = sinon.spy();
      const spy = sinon.spy(queue, 'getQueue');
      const hash = await queue.pushIntoQueue({
        request: new Request('http://lipsum.com/generate'),
      });

      const reqData = await queue.getRequestFromQueue({hash});

      expect(reqData).to.have.all.keys(['request', 'config', 'metadata']);
      expect(callbacks.requestWillDequeue.calledOnce).to.be.true;
      expect(callbacks.requestWillDequeue.calledWith(reqData)).to.be.true;
      expect(spy.called).to.be.true;
      queue.getQueue.restore();
      delete callbacks.requestWillDequeue;
    });
  });
});
