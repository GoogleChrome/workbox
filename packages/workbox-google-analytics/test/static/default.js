/*
 Copyright 2017 Google Inc. All Rights Reserved.
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

importScripts('/node_modules/sinon/pkg/sinon.js');
importScripts('/__test/bundle/workbox-google-analytics');

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (evt) => evt.waitUntil(clients.claim()));

// Add a sync event prior to calling googleAnalytics.initialize(), so this
// listener runs before any other sync listeners.
self.addEventListener('sync', (evt) => {
  // Once the sync event fires, restub fetch to no longer reject with errors.
  self.fetch.restore();
  sinon.stub(self, 'fetch').resolves(new Response('', {status: 200}));

  // Wait until fetch is called twice and get the requests,
  // then rerun the fetches to verify that they succeed.
  evt.waitUntil(new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      if (self.fetch.calledTwice) {
        clearInterval(interval);

        const request1 = self.fetch.args[0][0];
        const request2 = self.fetch.args[1][0];
        self.fetch.restore();

        const channel = new BroadcastChannel('workbox-google-analytics-sync');
        const responses = await Promise.all([fetch(request1), fetch(request2)]);

        if (responses[0].ok && responses[1].ok) {
          channel.postMessage('replay:success');
          resolve();
        } else {
          channel.postMessage('replay:failure');
          reject();
        }
        channel.close();
      }
    }, 100);
  }));
});

// Stub fetch to behave like it would when offline
sinon.stub(self, 'fetch').rejects(Response.error());

workbox.googleAnalytics.initialize();
