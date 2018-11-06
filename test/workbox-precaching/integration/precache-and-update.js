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

describe(`[workbox-precaching] Precache and Update`, function() {
  const DB_NAME = 'workbox-precache-http___localhost_3004_test_workbox-precaching_static_precache-and-update_';
  const baseUrl = `${global.__workbox.server.getAddress()}/test/workbox-precaching/static/precache-and-update/`;

  beforeEach(async function() {
    // Navigate to our test page and clear all caches before this test runs.
    await cleanSWEnv(global.__workbox.webdriver, `${baseUrl}index.html`);
  });

  it(`should load a page with service worker `, async function() {
    const SW_1_URL = `${baseUrl}sw-1.js`;
    const SW_2_URL = `${baseUrl}sw-2.js`;

    const getIdbData = global.__workbox.seleniumBrowser.getId() === 'safari' ?
      require('../utils/getPrecachedIDBData-safari') :
      require('../utils/getPrecachedIDBData');

    // Precaching will cache bust with a search param in some situations.
    const needsCacheBustSearchParam = await global.__workbox.webdriver.executeScript(() => {
      return !('cache' in Request.prototype);
    });

    let requestCounter = global.__workbox.server.startCountingRequests();

    // Register the first service worker.
    await activateAndControlSW(SW_1_URL);

    // Check that only the precache cache was created.
    const keys = await runInSW('cachesKeys');
    expect(keys).to.eql([
      'workbox-precache-http://localhost:3004/test/workbox-precaching/static/precache-and-update/',
    ]);

    // Check that the cached requests are what we expect for sw-1.js
    let cachedRequests = await runInSW('cacheUrls', 'workbox-precache-http://localhost:3004/test/workbox-precaching/static/precache-and-update/');
    expect(cachedRequests).to.have.members([
      'http://localhost:3004/test/workbox-precaching/static/precache-and-update/index.html',
      'http://localhost:3004/test/workbox-precaching/static/precache-and-update/styles/index.css',
    ]);

    let savedIDBData = await getIdbData(DB_NAME);
    expect(savedIDBData).to.eql([
      {
        revision: '1',
        url: 'http://localhost:3004/test/workbox-precaching/static/precache-and-update/index.html',
      },
      {
        revision: '1',
        url: 'http://localhost:3004/test/workbox-precaching/static/precache-and-update/styles/index.css',
      },
    ]);

    // Make sure the requested URL's include cache busting search param if needed.
    if (needsCacheBustSearchParam) {
      expect(requestCounter.getUrlCount('/test/workbox-precaching/static/precache-and-update/styles/index.css')).to.equal(1);
      expect(requestCounter.getUrlCount('/test/workbox-precaching/static/precache-and-update/index.html?_workbox-cache-bust=1')).to.equal(1);
      expect(requestCounter.getUrlCount('/test/workbox-precaching/static/precache-and-update/styles/index.css?_workbox-cache-bust=1')).to.equal(1);
    } else {
      expect(requestCounter.getUrlCount('/test/workbox-precaching/static/precache-and-update/styles/index.css')).to.equal(1);
      expect(requestCounter.getUrlCount('/test/workbox-precaching/static/precache-and-update/index.html')).to.equal(1);
    }

    // Unregister the old counter, and start a new count.
    global.__workbox.server.stopCountingRequests(requestCounter);
    requestCounter = global.__workbox.server.startCountingRequests();

    // Request the page and check that the precached assets weren't requested from the network.
    await global.__workbox.webdriver.get(`${baseUrl}index.html`);

    expect(requestCounter.getUrlCount('/test/workbox-precaching/static/precache-and-update/')).to.eql(0);
    expect(requestCounter.getUrlCount('/test/workbox-precaching/static/precache-and-update/index.html')).to.eql(0);
    expect(requestCounter.getUrlCount('/test/workbox-precaching/static/precache-and-update/styles/index.css')).to.eql(0);

    // Unregister the old counter, and start a new count.
    global.__workbox.server.stopCountingRequests(requestCounter);
    requestCounter = global.__workbox.server.startCountingRequests();

    // Activate the second service worker
    await activateAndControlSW(SW_2_URL);
    // Add a slight delay for the caching operation to complete.
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Ensure that the new assets were requested and cache busted.
    if (needsCacheBustSearchParam) {
      expect(requestCounter.getUrlCount('/test/workbox-precaching/static/precache-and-update/index.html?_workbox-cache-bust=2')).to.equal(1);
      expect(requestCounter.getUrlCount('/test/workbox-precaching/static/precache-and-update/new-request.txt?_workbox-cache-bust=2')).to.equal(1);
    } else {
      expect(requestCounter.getUrlCount('/test/workbox-precaching/static/precache-and-update/index.html')).to.equal(1);
      expect(requestCounter.getUrlCount('/test/workbox-precaching/static/precache-and-update/new-request.txt')).to.equal(1);
    }

    // Check that the cached entries were deleted / added as expected when
    // updating from sw-1.js to sw-2.js
    cachedRequests = await runInSW('cacheUrls', 'workbox-precache-http://localhost:3004/test/workbox-precaching/static/precache-and-update/');
    expect(cachedRequests).to.have.members([
      'http://localhost:3004/test/workbox-precaching/static/precache-and-update/index.html',
      'http://localhost:3004/test/workbox-precaching/static/precache-and-update/new-request.txt',
    ]);

    savedIDBData = await getIdbData(DB_NAME);
    expect(savedIDBData).to.deep.equal([
      {
        revision: '2',
        url: 'http://localhost:3004/test/workbox-precaching/static/precache-and-update/index.html',
      },
      {
        revision: '2',
        url: 'http://localhost:3004/test/workbox-precaching/static/precache-and-update/new-request.txt',
      },
    ]);

    // Unregister the old counter, and start a new count.
    global.__workbox.server.stopCountingRequests(requestCounter);
    requestCounter = global.__workbox.server.startCountingRequests();

    await global.__workbox.webdriver.get(`${baseUrl}index.html`);

    // Ensure the HTML page is returned from cache and not network
    expect(requestCounter.getUrlCount('/test/workbox-precaching/static/precache-and-update/index.html')).to.eql(0);
    // Ensure the now deleted index.css file is returned from network and not cache.
    expect(requestCounter.getUrlCount('/test/workbox-precaching/static/precache-and-update/styles/index.css')).to.equal(1);

    global.__workbox.server.stopCountingRequests(requestCounter);
  });
});
