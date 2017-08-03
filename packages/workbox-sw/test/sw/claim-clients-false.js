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

/**
 *
 *
 * This is a seperate test because adding activate and install events and
 * relying on it results in multiple event listeners being added and responding
 * to test cases.
 *
 * Seperating into files results in custom scopes and isolation for each test.
 *
 *
 */

describe(`Clients Claim parameter`, function() {
  let stubs = [];

  afterEach(function() {
    stubs.forEach((stub) => {
      stub.restore();
    });
    stubs = [];
  });

  it(`should not claim when passed in false (clientsClaim)`, function() {
    let called = false;
    const claimStub = sinon.stub(self.clients, 'claim').callsFake(() => {
      called = true;
      return Promise.resolve();
    });
    stubs.push(claimStub);
    new WorkboxSW({
      clientsClaim: false,
    });
    return new Promise((resolve, reject) => {
      const activateEvent = new Event('activate');
      activateEvent.waitUntil = (promiseChain) => {
        promiseChain.then(() => {
          if (called === false) {
            resolve();
          } else {
            reject('Client.claim() was called.');
          }
        });
      };
      self.dispatchEvent(activateEvent);
    });
  });
});
