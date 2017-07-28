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
/* global expect, workbox */
'use strict';

function delay(timeout) {
  return new Promise((resolve, reject) => {
    setTimeout(function() {
      resolve();
    }, timeout);
  });
}

describe('background sync queue test', () => {
  let responseAchieved = 0;
  function onRes() {
    responseAchieved = responseAchieved + 1;
  }
  function onRetryFail() {}

  const QUEUE_NAME = 'QUEUE_NAME';
  const MAX_AGE = 6;
  const CALLBACKS = {
    onResponse: onRes,
    onRetryFail: onRetryFail,
  };

  let backgroundSyncQueue;

  beforeEach(async function() {
    responseAchieved = 0;
    backgroundSyncQueue = new workbox.backgroundSync.test.BackgroundSyncQueue({
      maxRetentionTime: MAX_AGE,
      callbacks: CALLBACKS,
    });
  });

  afterEach(async function() {
    // replay queue so that further tests are not affected
    try {
      await backgroundSyncQueue.replayRequests();
    } catch (e) {
      // do nothing as this is just a cleanup exercise
    }
    await backgroundSyncQueue.cleanupQueue();
  });

  it('check defaults', () => {
    const defaultsBackgroundSyncQueue
      = new workbox.backgroundSync.test.BackgroundSyncQueue({});
    expect(defaultsBackgroundSyncQueue._queue).to.be.an('object');
    expect(defaultsBackgroundSyncQueue._requestManager).to.be.an('object');
    expect(defaultsBackgroundSyncQueue._queue._queueName).to.be
        .equal(workbox.backgroundSync.test.Constants.defaultQueueName + '_1');
    expect(defaultsBackgroundSyncQueue._queue._config.maxAge).to.be
        .equal(workbox.backgroundSync.test.Constants.maxAge);
    expect(
        JSON.stringify(
            defaultsBackgroundSyncQueue._requestManager._globalCallbacks))
        .to.be.equal(JSON.stringify({}));
  });

  it('check parameterised constructor', () =>{
    backgroundSyncQueue = new workbox.backgroundSync.test.BackgroundSyncQueue({
      maxRetentionTime: MAX_AGE,
      queueName: QUEUE_NAME,
      callbacks: CALLBACKS,
    });
    expect(backgroundSyncQueue._queue).to.be.an('object');
    expect(backgroundSyncQueue._requestManager).to.be.an('object');
    expect(backgroundSyncQueue._queue._queueName).to.be.equal(QUEUE_NAME);
    expect(backgroundSyncQueue._queue._config.maxAge).to.be.equal(MAX_AGE);
    expect(backgroundSyncQueue._requestManager._globalCallbacks).to.be
        .equal(CALLBACKS);
  });

  it('check push proxy', async function() {
    await backgroundSyncQueue.pushIntoQueue(
        {request: new Request('/__echo/counter')});
    expect(backgroundSyncQueue._queue.queue.length).to.be.equal(1);
  });

  it('check replay', async function() {
    await backgroundSyncQueue.pushIntoQueue(
        {request: new Request('/__echo/counter')});
    await backgroundSyncQueue.pushIntoQueue(
        {request: new Request('/__echo/counter')});
    expect(backgroundSyncQueue._queue.queue.length).to.be.equal(2);
    await backgroundSyncQueue.replayRequests();
    expect(responseAchieved).to.be.equal(2);
  });

  it('check replay failure with rejected promise', async function() {
    await backgroundSyncQueue.pushIntoQueue(
        {request: new Request('/__echo/counter')});
    await backgroundSyncQueue.pushIntoQueue(
        {request: new Request('/__test/404')});
    try {
      await backgroundSyncQueue.replayRequests();
      throw new Error('Replay should have failed because of invalid URL');
    } catch (err) {
      expect(404).to.be.equal(err[0].status);
    }
  });

  it('test queue cleanup', async () => {
    /* code for clearing everything from IDB */
    const backgroundSyncQueue
    = new workbox.backgroundSync.test.BackgroundSyncQueue({
      maxRetentionTime: 1,
    });

    const backgroundSyncQueue2
    = new workbox.backgroundSync.test.BackgroundSyncQueue({
      maxRetentionTime: 10000,
      dbName: 'Queue2',
    });

    await backgroundSyncQueue.cleanupQueue();
    await backgroundSyncQueue2.cleanupQueue();
    await backgroundSyncQueue.pushIntoQueue(
        {request: new Request('/__echo/counter')});
    await backgroundSyncQueue.pushIntoQueue(
        {request: new Request('/__echo/counter')});
    await backgroundSyncQueue2.pushIntoQueue(
        {request: new Request('/__echo/counter')});
    const queue1Keys = (await backgroundSyncQueue._queue._idbQDb.getAllKeys());
    const queue2Keys = (await backgroundSyncQueue2._queue._idbQDb.getAllKeys());
    await delay(100);
    await backgroundSyncQueue.cleanupQueue();
    await backgroundSyncQueue2.cleanupQueue();
    const expectedQueue1Keys =
        (await backgroundSyncQueue._queue._idbQDb.getAllKeys()).length + 2;
    const expectedQueue2Keys =
        (await backgroundSyncQueue2._queue._idbQDb.getAllKeys()).length;
    expect(queue1Keys.length).to.be.equal(expectedQueue1Keys);
    expect(queue2Keys.length).to.be.equal(expectedQueue2Keys);
  });
});
