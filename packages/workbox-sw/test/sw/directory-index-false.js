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

import WorkboxSW from '../../src';

describe(`Test Directory Index`, function() {
  let stubs = [];

  afterEach(function() {
    stubs.forEach((stub) => {
      stub.restore();
    });
    stubs = [];
  });

  // TODO(gauntface): skipped due to
  // https://github.com/GoogleChrome/workbox/pull/717
  it.skip(`should do nothing if passing in false`, function() {
    const EXAMPLE_URL = '/example/url/';

    let calledWithIndex = false;
    const claimStub = sinon.stub(Cache.prototype, 'match').callsFake((request) => {
      if (request === new URL(`${EXAMPLE_URL}index.html`, self.location).toString()) {
        calledWithIndex = true;
      }
      return Promise.resolve(null);
    });
    stubs.push(claimStub);

    const workboxSW = new WorkboxSW({
      directoryIndex: false,
    });
    workboxSW.precache([`${EXAMPLE_URL}index.html`]);
    workboxSW.router.registerRoute(EXAMPLE_URL, workboxSW.strategies.cacheFirst());

    return new Promise((resolve, reject) => {
      const fetchEvent = new FetchEvent('fetch', {
        request: new Request(EXAMPLE_URL),
      });
      fetchEvent.respondWith = (promiseChain) => {
        promiseChain.then(() => {
          if (!calledWithIndex) {
            resolve();
          } else {
            reject('cache.match() was called with directory index when it shouldnt have been.');
          }
        });
      };
      self.dispatchEvent(fetchEvent);
    });
  });
});
