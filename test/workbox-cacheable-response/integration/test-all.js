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
const waitUntil = require('../../../infra/testing/wait-until');
const {runUnitTests} = require('../../../infra/testing/webdriver/runUnitTests');

// Store local references of these globals.
const {webdriver, server} = global.__workbox;

describe(`[workbox-cacheable-response]`, function () {
  it(`passes all SW unit tests`, async function () {
    await runUnitTests('/test/workbox-cacheable-response/sw/');
  });
});

describe(`[workbox-cacheable-response] Plugin`, function () {
  const baseURL = `${server.getAddress()}/test/workbox-cacheable-response/static/cacheable-response-plugin/`;

  beforeEach(async function () {
    // Navigate to our test page and clear all caches before this test runs.
    await cleanSWEnv(webdriver, `${baseURL}integration.html`);
  });

  it(`should load a page and cache entries`, async function () {
    const swURL = `${baseURL}sw.js`;

    // Wait for the service worker to register and activate.
    await activateAndControlSW(swURL);

    const error = await webdriver.executeAsyncScript((cb) => {
      fetch(`example-1.txt`)
        .then(() => cb())
        .catch((err) => cb(err.message));
    });
    if (error) {
      throw new Error(error);
    }

    // Caching is done async from returning a response, so we may need
    // to wait before the cache has some content.
    await waitUntil(async () => {
      const keys = await runInSW('cachesKeys');
      return keys.length > 0;
    });

    const keys = await runInSW('cachesKeys');
    expect(keys).to.deep.equal(['cacheable-response-cache']);

    const cachedRequests = await runInSW('cacheURLs', keys[0]);
    expect(cachedRequests).to.eql([`${baseURL}example-1.txt`]);
  });
});
