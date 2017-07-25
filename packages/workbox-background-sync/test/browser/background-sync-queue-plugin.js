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
/* global chai */

import IDBHelper from '../../../../lib/idb-helper.js';
import BackgroundSyncQueuePlugin
    from '../../src/lib/background-sync-queue-plugin.js';
import {defaultDBName} from '../../src/lib/constants.js';

describe(`background-sync-queue-plugin test`, function() {
  const db = new IDBHelper(defaultDBName, 1, 'QueueStore');
  const resetDb = async function() {
    const keys = await db.getAllKeys();
    return Promise.all(keys.map((key) => db.delete(key)));
  };

  before(resetDb);
  afterEach(resetDb);

  it(`check fetchDid fail proxy`, async function() {
    const backgroundSyncQueue = new BackgroundSyncQueuePlugin({});
    const currentLen = backgroundSyncQueue._queue.queue.length;

    await backgroundSyncQueue.fetchDidFail({
      request: new Request('http://lipsum.com'),
    });
    chai.assert.equal(backgroundSyncQueue._queue.queue.length, currentLen + 1);
  });
});
