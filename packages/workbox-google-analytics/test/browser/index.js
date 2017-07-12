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

import constants from '../../src/lib/constants.js';
import IDBHelper from '../../../../lib/idb-helper.js';
import RequestQueue from '../../../workbox-background-sync/src/lib/request-queue.js';


const STATIC_ASSETS_PATH = '/packages/workbox-google-analytics/test/static';
const HIT_PAYLOAD = 'v=1&t=pageview&tid=UA-12345-1&cid=1&dp=%2F'


describe(`workbox-google-analytics`, function() {
  const db = new IDBHelper(constants.IDB.NAME, 1, 'QueueStore');
  const resetDb = async function() {
    const keys = await db.getAllKeys();
    return Promise.all(keys.map((key) => db.delete(key)));
  };

  before(function() {
    return window.goog.swUtils.cleanState().then(resetDb);
  });

  it(`should add failed requests to a background sync queue and replay them`,
      async function() {
    const iframe = await window.goog.swUtils.activateSW(
        `${STATIC_ASSETS_PATH}/default.js`);

    // A promise that resolves once the sync event fires and the requests
    // are replayed in the service worker.
    const syncMessageReceived = new Promise((resolve, reject) => {
      let replayedRequests = 0;
      const channel = new BroadcastChannel('workbox-google-analytics-sync');
      channel.onmessage = (evt) => {
        if (evt.data == 'replay:success') {
          channel.close();
          resolve();
        } else {
          reject(new Error('replay:failure'));
        }
        channel.close();
      };
    });

    try {
      iframe.contentWindow.navigator.sendBeacon(
          `https://${constants.URL.HOST}${constants.URL.COLLECT_PATH}`,
          HIT_PAYLOAD + 'foo=1');

      await iframe.contentWindow.fetch(`https://${constants.URL.HOST}` +
          `${constants.URL.COLLECT_PATH}?${HIT_PAYLOAD}&foo=2`);
    } catch(err) {
      // A network error is expected.
    }

    await syncMessageReceived;
  });
});
