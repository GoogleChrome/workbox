/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const {expect} = require('chai');
const activateAndControlSW = require('../../../infra/testing/activate-and-control');
const {runUnitTests} = require('../../../infra/testing/webdriver/runUnitTests');


// Store local references of these globals.
const {webdriver, server} = global.__workbox;

describe(`[workbox-streams]`, function() {
  it(`passes all SW unit tests`, async function() {
    await runUnitTests('/test/workbox-streams/sw/');
  });
});

describe(`[workbox-streams] Integration Tests`, function() {
  const testServerAddress = server.getAddress();
  const testingURL = `${testServerAddress}/test/workbox-streams/static/`;
  const swURL = `${testingURL}sw.js`;

  before(async function() {
    await webdriver.get(testingURL);
    await activateAndControlSW(swURL);
  });

  for (const testCase of ['concatenate', 'concatenateToResponse', 'strategy']) {
    it(`should return the expected response for the '${testCase}' approach`, async function() {
      const {text, headers} = await webdriver.executeAsyncScript(async (testCase, cb) => {
        try {
          const response = await fetch(new URL(testCase, location));
          const headers = [...response.headers].sort((a, b) => {
            return a[0] > b[0];
          });
          const text = await response.text();
          cb({headers, text});
        } catch (error) {
          cb({text: error.message});
        }
      }, testCase);

      if (text === 'No streams support') {
        this.skip();
      } else {
        expect(text).to.eql('01234\n');
        expect(headers).to.eql([
          ['content-type', 'text/plain'],
          ['x-test-case', testCase],
        ]);
      }
    });
  }
});
