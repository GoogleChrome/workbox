/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;
const activateAndControlSW = require('../../../infra/testing/activate-and-control');
const waitUntil = require('../../../infra/testing/wait-until');
const {runUnitTests} = require('../../../infra/testing/webdriver/runUnitTests');

// Store local references of these globals.
const {webdriver, server} = global.__workbox;

describe(`[workbox-background-sync]`, function () {
  it(`passes all SW unit tests`, async function () {
    await runUnitTests('/test/workbox-background-sync/sw/');
  });
});

describe(`[workbox-background-sync] Load and use Background Sync`, function () {
  const testServerAddress = server.getAddress();
  const testingURL = `${testServerAddress}/test/workbox-background-sync/static/basic-example/`;
  const swURL = `${testingURL}sw.js`;

  let requestCounter;
  beforeEach(function () {
    requestCounter = server.startCountingRequests();
  });
  afterEach(function () {
    server.stopCountingRequests(requestCounter);
  });

  it(`should load a page with service worker`, async function () {
    // Load the page and wait for the first service worker to register and activate.
    await webdriver.get(testingURL);
    await activateAndControlSW(swURL);

    const url = `/test/workbox-background-sync/static/basic-example/example.txt`;
    const err = await webdriver.executeAsyncScript((url, cb) => {
      return fetch(url)
        .then(() => cb())
        .catch((err) => cb(err.message));
    }, url);

    expect(err).to.not.exist;

    await waitUntil(
      () => {
        const count = requestCounter.getURLCount(url);
        return count > 0;
      },
      20,
      500,
    );
  });
});
