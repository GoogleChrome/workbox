/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const activateAndControlSW = require('../../../infra/testing/activate-and-control');

describe(`[workbox-core] Load core in the browser`, function() {
  const testServerAddress = global.__workbox.server.getAddress();
  const testingURL = `${testServerAddress}/test/workbox-core/static/core-in-browser/`;
  const swURL = `${testingURL}sw.js`;

  it(`should load workbox-core in a service worker.`, async function() {
    await global.__workbox.webdriver.get(testingURL);
    await activateAndControlSW(swURL);

    // If the service worker activated, it meant the assertions in sw.js were
    // met and workbox-core exposes the expected API and defaults that were
    // expected
  });
});
