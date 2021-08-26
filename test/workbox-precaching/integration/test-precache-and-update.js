/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;

const activateAndControlSW = require('../../../infra/testing/activate-and-control');
const cleanSWEnv = require('../../../infra/testing/clean-sw');
const runInSW = require('../../../infra/testing/comlink/node-interface');

describe(`[workbox-precaching] Precache and Update`, function () {
  const baseURL = `${global.__workbox.server.getAddress()}/test/workbox-precaching/static/precache-and-update/`;

  beforeEach(async function () {
    // Navigate to our test page and clear all caches before this test runs.
    await cleanSWEnv(global.__workbox.webdriver, `${baseURL}index.html`);
  });

  it(`should load a page with service worker `, async function () {
    const SW_1_URL = `${baseURL}sw-1.js`;
    const SW_2_URL = `${baseURL}sw-2.js`;

    const cacheName =
      'workbox-precache-v2-http://localhost:3004/test/workbox-precaching/static/precache-and-update/';

    let requestCounter = global.__workbox.server.startCountingRequests();

    // Register the first service worker.
    await activateAndControlSW(SW_1_URL);

    // Check that only the precache cache was created.
    const keys = await runInSW('cachesKeys');
    expect(keys).to.eql([cacheName]);

    // Check that the cached requests are what we expect for sw-1.js
    let cachedRequests = await runInSW('cacheURLs', cacheName);
    expect(cachedRequests).to.have.members([
      'http://localhost:3004/test/workbox-precaching/static/precache-and-update/index.html?__WB_REVISION__=1',
      'http://localhost:3004/test/workbox-precaching/static/precache-and-update/styles/index.css?__WB_REVISION__=1',
    ]);

    expect(
      requestCounter.getURLCount(
        '/test/workbox-precaching/static/precache-and-update/styles/index.css',
      ),
    ).to.equal(1);
    expect(
      requestCounter.getURLCount(
        '/test/workbox-precaching/static/precache-and-update/index.html',
      ),
    ).to.equal(1);

    // Unregister the old counter, and start a new count.
    global.__workbox.server.stopCountingRequests(requestCounter);
    requestCounter = global.__workbox.server.startCountingRequests();

    // Request the page and check that the precached assets weren't requested from the network.
    // Include the default ignoreURLParametersMatching query parameters.
    await global.__workbox.webdriver.get(`${baseURL}index.html`);
    await global.__workbox.webdriver.get(
      `${baseURL}index.html?utm_source=test`,
    );
    await global.__workbox.webdriver.get(`${baseURL}index.html?fbclid=test`);

    expect(
      requestCounter.getURLCount(
        '/test/workbox-precaching/static/precache-and-update/',
      ),
    ).to.eql(0);
    expect(
      requestCounter.getURLCount(
        '/test/workbox-precaching/static/precache-and-update/index.html',
      ),
    ).to.eql(0);
    expect(
      requestCounter.getURLCount(
        '/test/workbox-precaching/static/precache-and-update/index.html?utm_source=test',
      ),
    ).to.eql(0);
    expect(
      requestCounter.getURLCount(
        '/test/workbox-precaching/static/precache-and-update/index.html?fbclid=test',
      ),
    ).to.eql(0);
    expect(
      requestCounter.getURLCount(
        '/test/workbox-precaching/static/precache-and-update/styles/index.css',
      ),
    ).to.eql(0);

    // Unregister the old counter, and start a new count.
    global.__workbox.server.stopCountingRequests(requestCounter);
    requestCounter = global.__workbox.server.startCountingRequests();

    // Activate the second service worker
    await activateAndControlSW(SW_2_URL);
    // Add a slight delay for the caching operation to complete.
    await new Promise((resolve) => setTimeout(resolve, 1000));

    expect(
      requestCounter.getURLCount(
        '/test/workbox-precaching/static/precache-and-update/index.html',
      ),
    ).to.equal(1);
    expect(
      requestCounter.getURLCount(
        '/test/workbox-precaching/static/precache-and-update/hashed-file.abcd1234.txt',
      ),
    ).to.equal(1);

    // Check that the cached entries were deleted / added as expected when
    // updating from sw-1.js to sw-2.js
    cachedRequests = await runInSW('cacheURLs', cacheName);
    expect(cachedRequests).to.have.members([
      'http://localhost:3004/test/workbox-precaching/static/precache-and-update/index.html?__WB_REVISION__=2',
      'http://localhost:3004/test/workbox-precaching/static/precache-and-update/hashed-file.abcd1234.txt',
    ]);

    // Unregister the old counter, and start a new count.
    global.__workbox.server.stopCountingRequests(requestCounter);
    requestCounter = global.__workbox.server.startCountingRequests();

    await global.__workbox.webdriver.get(baseURL);

    // Ensure the HTML page is returned from cache and not network.
    expect(
      requestCounter.getURLCount(
        '/test/workbox-precaching/static/precache-and-update/',
      ),
    ).to.eql(0);
    // Ensure the now deleted index.css file is returned from network and not cache.
    expect(
      requestCounter.getURLCount(
        '/test/workbox-precaching/static/precache-and-update/styles/index.css',
      ),
    ).to.equal(1);

    global.__workbox.server.stopCountingRequests(requestCounter);
  });
});
