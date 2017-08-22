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

  it(`should accept custom index`, function() {
    const EXAMPLE_URL = '/example/url/';
    const DIRECTORY_INDEX = 'custom.html';

    let calledWithIndex = false;
    const claimStub = sinon.stub(Cache.prototype, 'match').callsFake((request) => {
      if (request === new URL(`${EXAMPLE_URL}${DIRECTORY_INDEX}`, self.location).toString()) {
        calledWithIndex = true;
      }
      return Promise.resolve(null);
    });
    stubs.push(claimStub);

    const workboxSW = new WorkboxSW({
      directoryIndex: DIRECTORY_INDEX,
    });
    workboxSW.precache([`${EXAMPLE_URL}${DIRECTORY_INDEX}`]);

    return new Promise((resolve, reject) => {
      const fetchEvent = new FetchEvent('fetch', {
        request: new Request(EXAMPLE_URL),
      });
      fetchEvent.respondWith = (promiseChain) => {
        promiseChain.then(() => {
          if (calledWithIndex) {
            resolve();
          } else {
            reject('cache.match() was NOT called with directory index.');
          }
        });
      };
      self.dispatchEvent(fetchEvent);
    });
  });

  it(`should take the ignoreUrlParametersMatching setting into account when using the directoryIndex`, function() {
    const EXAMPLE_URL = '/example/url/';
    const DIRECTORY_INDEX = 'custom.html';
    const URL_PARAM = 'test';
    const IGNORE_URL_PARAMETERS_MATCHING = [new RegExp(URL_PARAM)];

    const workboxSW = new WorkboxSW({
      directoryIndex: DIRECTORY_INDEX,
      ignoreUrlParametersMatching: IGNORE_URL_PARAMETERS_MATCHING,
    });

    workboxSW.precache([`${EXAMPLE_URL}${DIRECTORY_INDEX}`]);

    return new Promise((resolve) => {
      const fetchEvent = new FetchEvent('fetch', {
        // Fire a request for the URL without the directory index, but with the URL param.
        request: new Request(`${EXAMPLE_URL}?${URL_PARAM}`),
      });

      // cache.match() will only be called if the precache route's capture
      // function returned true, which implies that the URL param was ignored.
      const stub = sinon.stub(Cache.prototype, 'match').callsFake(resolve);
      stubs.push(stub);

      self.dispatchEvent(fetchEvent);
    });
  });
});
