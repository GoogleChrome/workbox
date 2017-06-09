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
/* global chai, workbox */

'use strict';
const testServerGen = require('../../../../utils/test-server-generator.js');
const path = require('path');
const fs = require('fs');
const fsExtra = require('fs-extra');

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
  let tmpDirectory;
  let testServer;
  let baseTestUrl;

  before(function() {
    tmpDirectory = fs.mkdtempSync(
      path.join(__dirname, 'tmp-')
    );

    testServer = testServerGen();
    return testServer.start(tmpDirectory, 5050)
    .then((portNumber) => {
      baseTestUrl = `http://localhost:${portNumber}`;
    });
  });

  // Kill the web server once all tests are complete.
  after(function() {
    this.timeout(10 * 1000);

    fsExtra.removeSync(tmpDirectory);

    return testServer.stop();
  });

  beforeEach(async ()=>{
    responseAchieved = 0;
    backgroundSyncQueue = new workbox.backgroundSync.test.BackgroundSyncQueue({
      maxRetentionTime: MAX_AGE,
      queueName: QUEUE_NAME,
      callbacks: CALLBACKS,
    });
  });

  it('check defaults', () => {
    const defaultsBackgroundSyncQueue
      = new workbox.backgroundSync.test.BackgroundSyncQueue({});
    chai.assert.isObject(defaultsBackgroundSyncQueue._queue);
    chai.assert.isObject(defaultsBackgroundSyncQueue._requestManager);
    chai.assert.equal(defaultsBackgroundSyncQueue._queue._queueName,
      workbox.backgroundSync.test.Constants.defaultQueueName + '_0');
    chai.assert.equal(defaultsBackgroundSyncQueue._queue._config.maxAge,
      workbox.backgroundSync.test.Constants.maxAge);
    chai.assert.equal(
      JSON.stringify(
        defaultsBackgroundSyncQueue._requestManager._globalCallbacks),
      JSON.stringify({}));
  });

  it('check parameterised constructor', () =>{
    chai.assert.isObject(backgroundSyncQueue._queue);
    chai.assert.isObject(backgroundSyncQueue._requestManager);
    chai.assert.equal(backgroundSyncQueue._queue._queueName, QUEUE_NAME);
    chai.assert.equal(backgroundSyncQueue._queue._config.maxAge, MAX_AGE);
    chai.assert.equal(backgroundSyncQueue._requestManager._globalCallbacks,
      CALLBACKS);
  });

  it('check push proxy', async () => {
    await backgroundSyncQueue.pushIntoQueue({request: new Request(`${baseTestUrl}/__echo/counter`)});
    chai.assert.equal(backgroundSyncQueue._queue.queue.length, 1);
  });

  it('check replay', async function() {
    await backgroundSyncQueue.pushIntoQueue({request: new Request(`${baseTestUrl}/__echo/counter`)});
    await backgroundSyncQueue.pushIntoQueue({request: new Request(`${baseTestUrl}/__echo/counter`)});
    await backgroundSyncQueue.replayRequests();
    chai.assert.equal(responseAchieved, 2);
  });

  it('check replay failure with rejected promise', async function() {
    await backgroundSyncQueue.pushIntoQueue({request: new Request(`${baseTestUrl}/__echo/counter`)});
    await backgroundSyncQueue.pushIntoQueue({request: new Request(`${baseTestUrl}/__test/404`)});
    try {
      await backgroundSyncQueue.replayRequests();
      throw new Error('Replay should have failed because of invalid URL');
    } catch (err) {
      chai.assert.equal(404, err[0].status);
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
    await backgroundSyncQueue.pushIntoQueue({request: new Request(`${baseTestUrl}/__echo/counter`)});
    await backgroundSyncQueue.pushIntoQueue({request: new Request(`${baseTestUrl}/__echo/counter`)});
    await backgroundSyncQueue2.pushIntoQueue({request: new Request(`${baseTestUrl}/__echo/counter`)});
    const queue1Keys = (await backgroundSyncQueue._queue._idbQDb.getAllKeys());
    const queue2Keys = (await backgroundSyncQueue2._queue._idbQDb.getAllKeys());
    await delay(100);
    await backgroundSyncQueue.cleanupQueue();
    await backgroundSyncQueue2.cleanupQueue();
    chai.assert.equal(queue1Keys.length,
      (await backgroundSyncQueue._queue._idbQDb.getAllKeys()).length + 2);
    chai.assert.equal(queue2Keys.length,
      (await backgroundSyncQueue2._queue._idbQDb.getAllKeys()).length);
  });
});
