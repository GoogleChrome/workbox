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
/* global chai, sinon, workbox */

'use strict';

describe('request-queue tests', () => {
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

  it('queue object should exist', () => {
    chai.assert.isObject(queue);
    chai.assert.isArray(queue._queue);
    chai.assert.isString(queue._queueName);
    chai.assert.isObject(queue._config);
  });

  it('queueName is corrent', () =>{
    chai.assert.equal(queue._queueName, QUEUE_NAME);
  });

  it('config is correct', () => {
    chai.assert.equal(queue._config.maxAge, MAX_AGE);
    chai.assert.notEqual(
      queue._config.maxAge, workbox.backgroundSync.test.Constants.maxAge);
  });

  it('push is working', async () => {
    callbacks.requestWillEnqueue = sinon.spy();

    const queueLength = queue._queue.length;
    const hash = await queue.push({
      request: new Request('http://lipsum.com/generate'),
    });

    chai.assert.isString(hash);
    chai.assert.equal(queue._queue.length, queueLength + 1);

    chai.assert(callbacks.requestWillEnqueue.calledOnce);
    chai.assert(callbacks.requestWillEnqueue.calledWith(
        sinon.match.has('request')));

    delete callbacks.requestWillEnqueue;
  });

  it('getRequestFromQueue is working', async () => {
    callbacks.requestWillDequeue = sinon.spy();

    const hash = await queue.push({
      request: new Request('http://lipsum.com/generate'),
    });

    const reqData = await queue.getRequestFromQueue({hash});

    chai.assert.hasAllKeys(reqData, ['request', 'config', 'metadata']);
    chai.assert(callbacks.requestWillDequeue.calledOnce);
    chai.assert(callbacks.requestWillDequeue.calledWith(reqData));

    delete callbacks.requestWillDequeue;
  });

  it('default config is correct', () => {
    let tempQueue = new workbox.backgroundSync.test.RequestQueue({
      idbQDb: idbHelper,
    });
    let tempQueue2 = new workbox.backgroundSync.test.RequestQueue({
      idbQDb: idbHelper,
    });
    chai.assert.equal(tempQueue._config, undefined);
    chai.assert.equal(tempQueue._queueName,
      workbox.backgroundSync.test.Constants.defaultQueueName + '_0');
    chai.assert.equal(tempQueue2._queueName,
      workbox.backgroundSync.test.Constants.defaultQueueName + '_1');
  });
});
