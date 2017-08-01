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
/* global workbox */

'use strict';

describe('background-sync-queue-plugin', () => {
  const backgroundSyncQueue =
      new workbox.backgroundSync.test.BackgroundSyncQueuePlugin({});

  it('should add the request to queue when fetch fails', async () => {
    const currentLen = backgroundSyncQueue._queue.queue.length;
    await backgroundSyncQueue.fetchDidFail({
      request: new Request('http://lipsum.com'),
    });
    expect(backgroundSyncQueue._queue.queue.length).to.equal(currentLen + 1);
  });
});
