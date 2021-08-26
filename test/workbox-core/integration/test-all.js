/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const activateAndControlSW = require('../../../infra/testing/activate-and-control');
const {runUnitTests} = require('../../../infra/testing/webdriver/runUnitTests');

// Store local references of these globals.
const {webdriver, server} = global.__workbox;

describe(`[workbox-core]`, function () {
  it(`passes all SW unit tests`, async function () {
    await runUnitTests('/test/workbox-core/sw/');
  });
});

describe(`[workbox-core] Load core in the browser`, function () {
  const testServerAddress = server.getAddress();
  const testingURL = `${testServerAddress}/test/workbox-core/static/core-in-browser/`;
  const swURL = `${testingURL}sw.js`;

  it(`should load workbox-core in a service worker.`, async function () {
    await webdriver.get(testingURL);
    await activateAndControlSW(swURL);

    // If the service worker activated, it meant the assertions in sw.js were
    // met and workbox-core exposes the expected API and defaults that were
    // expected
  });
});
