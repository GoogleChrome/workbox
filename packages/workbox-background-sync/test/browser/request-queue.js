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
/* global sinon, workbox */

'use strict';

describe('request-queue', () => {
  const QUEUE_NAME = 'QUEUE_NAME';
  const MAX_AGE = 6;

  const callbacks = {};
  const idbHelper = new workbox.backgroundSync.test.IdbHelper(
    'bgQueueSyncDB', 1, 'QueueStore');
  const queue = new workbox.backgroundSync.test.RequestQueue({
    idbQDb: idbHelper,
    config: {maxAge: MAX_AGE},
    queueName: QUEUE_NAME,
    callbacks,
  });

  describe('constructor', () => {
    it('should initialize with correct object types', () => {
      expect(queue).to.be.an('object');
      expect(queue._queue).to.be.an('array');
      expect(queue._queueName).to.be.a('string');
      expect(queue._config).to.be.an('object');
    });

    it('should should not fail for null data', async () => {
      expect(queue._queue.length).to.equal(0);
      idbHelper.put(queue._queueName, null);
      await queue.initQueue();
      expect(queue._queue.length).to.equal(0);
    });

    it('should re-fill the queue', async () => {
      expect(queue._queue.length).to.equal(0);
      const hash = await queue.push({
        request: new Request('http://lipsum.com/generate'),
      });
      expect(queue._queue.length).to.equal(1);
      queue._queue = [];
      expect(queue._queue.length).to.equal(0);
      await queue.initQueue();
      expect(queue._queue.length).to.equal(1);
      expect(queue._queue[0]).to.equal(hash);
    });

    it('should fill the queueName correctly', () => {
      expect(queue._queueName).to.equal(QUEUE_NAME);
    });

    it('should configure correctly', () => {
      expect(queue._config.maxAge).to.equal(MAX_AGE);
      expect(queue._config.maxAge).to.be.not
          .equal(workbox.backgroundSync.test.Constants.maxAge);
    });

    it('should configure correctly without any optional parameters given', () => {
      let tempQueue = new workbox.backgroundSync.test.RequestQueue({
        idbQDb: idbHelper,
      });
      let tempQueue2 = new workbox.backgroundSync.test.RequestQueue({
        idbQDb: idbHelper,
      });
      expect(tempQueue._config).to.equal(undefined);
      expect(tempQueue._queueName).to.be
          .equal(workbox.backgroundSync.test.Constants.defaultQueueName + '_0');
      expect(tempQueue2._queueName).to.be
          .equal(workbox.backgroundSync.test.Constants.defaultQueueName + '_1');
    });
  });

  describe('push method', () => {
    it('should push the Request given in the private array', async () => {
      callbacks.requestWillEnqueue = sinon.spy();

      const queueLength = queue._queue.length;
      const hash = await queue.push({
        request: new Request('http://lipsum.com/generate'),
      });

      expect(hash).to.be.a('string');
      expect(queue._queue.length).to.equal(queueLength + 1);

      expect(callbacks.requestWillEnqueue.calledOnce).to.be.true;
      expect(callbacks.requestWillEnqueue.calledWith(sinon.match.has('request')))
          .to.be.true;

      delete callbacks.requestWillEnqueue;
    });
  });

  describe('getRequestFromQueue method', () => {
    it('should get the proper Request back', async () => {
      callbacks.requestWillDequeue = sinon.spy();

      const hash = await queue.push({
        request: new Request('http://lipsum.com/generate'),
      });

      const reqData = await queue.getRequestFromQueue({hash});

      expect(reqData).to.have.all.keys(['request', 'config', 'metadata']);
      expect(callbacks.requestWillDequeue.calledOnce).to.be.true;
      expect(callbacks.requestWillDequeue.calledWith(reqData)).to.be.true;

      delete callbacks.requestWillDequeue;
    });
  });
});
