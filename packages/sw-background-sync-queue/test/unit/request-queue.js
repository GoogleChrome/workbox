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
/* global chai, goog */

'use strict';

describe('queue', () => {
  const QUEUE_NAME = 'QUEUE_NAME';
  const MAX_AGE = 6;
  let queue =
    new goog.backgroundSyncQueue.test.RequestQueue({
      config: {maxAge: MAX_AGE},
      queueName: QUEUE_NAME,
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
      queue._config.maxAge, goog.backgroundSyncQueue.test.constants.maxAge);
  });

  it('pushRequest is working', () => {
    let queueLength = queue._queue.length;
    return queue.push({request: new Request('http://lipsum.com/generate')})
      .then(() => {
        chai.assert.equal(queue._queue.length, queueLength + 1);
      });
  });

  it('default config is correct', () => {
    let tempQueue = new goog.backgroundSyncQueue.test.RequestQueue({});
    let tempQueue2 = new goog.backgroundSyncQueue.test.RequestQueue({});
    chai.assert.equal(tempQueue._config, undefined);
    chai.assert.equal(tempQueue._queueName,
      goog.backgroundSyncQueue.test.constants.defaultQueueName + '_0');
    chai.assert.equal(tempQueue2._queueName,
      goog.backgroundSyncQueue.test.constants.defaultQueueName + '_1');
  });
});
