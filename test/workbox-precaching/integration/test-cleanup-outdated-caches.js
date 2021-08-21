/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;

const activateAndControlSW = require('../../../infra/testing/activate-and-control');
const cleanSWEnv = require('../../../infra/testing/clean-sw');
const runInSW = require('../../../infra/testing/comlink/node-interface');

describe(`[workbox-precaching] cleanupOutdatedCaches()`, function () {
  const baseURL = `${global.__workbox.server.getAddress()}/test/workbox-precaching/static/cleanup-outdated-caches/`;

  beforeEach(async function () {
    // Navigate to our test page and clear all caches before this test runs.
    await cleanSWEnv(global.__workbox.webdriver, `${baseURL}integration.html`);
  });

  it(`should clean up outdated precached after activation`, async function () {
    // Add an item to an outdated cache.
    const preActivateKeys = await global.__workbox.webdriver.executeAsyncScript(
      (cb) => {
        // Opening a cache with a given name will cause it to "exist", even if it's empty.
        caches
          .open(
            'workbox-precache-http://localhost:3004/test/workbox-precaching/static/cleanup-outdated-caches/',
          )
          .then(() => caches.keys())
          .then((keys) => cb(keys))
          .catch((err) => cb(err.message));
      },
    );

    expect(preActivateKeys).to.include(
      'workbox-precache-http://localhost:3004/test/workbox-precaching/static/cleanup-outdated-caches/',
    );
    expect(preActivateKeys).to.not.include(
      'workbox-precache-v2-http://localhost:3004/test/workbox-precaching/static/cleanup-outdated-caches/',
    );

    // Register the first service worker.
    await activateAndControlSW(`${baseURL}sw.js`);

    const postActivateKeys = await runInSW('cachesKeys');
    expect(postActivateKeys).to.not.include(
      'workbox-precache-http://localhost:3004/test/workbox-precaching/static/cleanup-outdated-caches/',
    );
    expect(postActivateKeys).to.include(
      'workbox-precache-v2-http://localhost:3004/test/workbox-precaching/static/cleanup-outdated-caches/',
    );
  });
});
