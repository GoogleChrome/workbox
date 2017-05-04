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

describe('response-manager test', () => {
  const response = 'VALUE';
  let idbHelper;
  let resManager;

  before(() => {
    idbHelper = new goog.backgroundSyncQueue.test.IdbHelper(
      'bgQueueSyncDB', 1, 'QueueStore');
    resManager = goog.backgroundSyncQueue.test.ResponseManager;
  });

  it('check get', () => {
		const queue = new goog.backgroundSyncQueue.test.BackgroundSyncQueue();
    return idbHelper.put('key', {response: response}).then(()=>{
        return queue.getResponse({id: 'key'}).then((data)=>{
            chai.assert.equal(data, response);
        });
    });
  });

  it('check put', (done) => {
      resManager.putResponse({
          hash: 'somehash',
          idbObject: {},
          response: new Response(response),
          idbQDb: idbHelper,
      }).then(()=>{
        idbHelper.get('somehash').then((cachedResponse) => {
            // Response is stored as BLOB, using FileReader to convert back
            const reader = new window.FileReader();
            reader.readAsText(cachedResponse.response.body);
            reader.onloadend = function() {
                const data = reader.result;
                chai.assert.equal(data, response);
                done();
            };
        });
      });
  });
});
