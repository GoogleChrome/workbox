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

describe(`[workbox-expiration]`, function () {
  it(`passes all SW unit tests`, async function () {
    await runUnitTests('/test/workbox-expiration/sw/');
  });
});

describe(`[workbox-expiration] Plugin`, function () {
  const baseURL = `${server.getAddress()}/test/workbox-expiration/static/expiration-plugin/`;

  beforeEach(async function () {
    // Navigate to our test page and clear all caches before this test runs.
    await cleanSWEnv(webdriver, `${baseURL}integration.html`);
  });

  it(`should load a page with entries managed by maxEntries`, async function () {
    const swURL = `${baseURL}sw-max-entries.js`;

    // Wait for the service worker to register and activate.
    await activateAndControlSW(swURL);

    let error = await webdriver.executeAsyncScript((cb) => {
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
    expect(keys).to.deep.equal(['expiration-plugin-max-entries']);

    let cachedRequests = await runInSW('cacheURLs', keys[0]);
    expect(cachedRequests).to.eql([`${baseURL}example-1.txt`]);

    error = await webdriver.executeAsyncScript((cb) => {
      fetch(`example-2.txt`)
        .then(() => cb())
        .catch((err) => cb(err.message));
    });
    if (error) {
      throw new Error(error);
    }

    // Caching is done async from returning a response, so we may need
    // to wait before the cache has be cleaned up.
    await waitUntil(async () => {
      cachedRequests = await runInSW('cacheURLs', keys[0]);
      return (
        cachedRequests.length === 1 &&
        cachedRequests[0] === `${baseURL}example-2.txt`
      );
    });
  });

  it(`should load a page with entries managed by maxAgeSeconds`, async function () {
    const swURL = `${baseURL}sw-max-age-seconds.js`;

    // Wait for the service worker to register and activate.
    await activateAndControlSW(swURL);

    let error = await webdriver.executeAsyncScript((cb) => {
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
    expect(keys).to.deep.equal(['expiration-plugin-max-age-seconds']);

    let cachedRequests = await runInSW('cacheURLs', keys[0]);
    expect(cachedRequests).to.eql([`${baseURL}example-1.txt`]);

    // Wait 2 seconds to expire entry.
    await new Promise((resolve) => {
      setTimeout(resolve, 2000);
    });

    error = await webdriver.executeAsyncScript((cb) => {
      fetch(`example-2.txt`)
        .then(() => cb())
        .catch((err) => cb(err.message));
    });
    if (error) {
      throw new Error(error);
    }

    // Caching is done async from returning a response, so we may need
    // to wait before the cache has be cleaned up.
    await waitUntil(async () => {
      cachedRequests = await runInSW('cacheURLs', keys[0]);
      return (
        cachedRequests.length === 1 &&
        cachedRequests[0] === `${baseURL}example-2.txt`
      );
    });
  });

  it(`should clean up when deleteCacheAndMetadata() is called`, async function () {
    const swURL = `${baseURL}sw-deletion.js`;

    // Wait for the service worker to register and activate.
    await activateAndControlSW(swURL);

    let error = await webdriver.executeAsyncScript((cb) => {
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

    let keys = await runInSW('cachesKeys');
    expect(keys).to.deep.equal(['expiration-plugin-deletion']);

    const existence = await runInSW('doesDbExist', 'workbox-expiration');
    expect(existence).to.be.true;

    error = await webdriver.executeAsyncScript((cb) => {
      navigator.serviceWorker.addEventListener(
        'message',
        (event) => {
          cb(event.data);
        },
        {once: true},
      );
      navigator.serviceWorker.controller.postMessage('delete');
    });
    if (error) {
      throw new Error(error);
    }

    // After cleanup, there shouldn't be any cache keys or IndexedDB entries
    // with the cacheName 'expiration-plugin-deletion'.
    keys = await runInSW('cachesKeys');
    expect(keys).to.deep.equal([]);

    const entries = (
      await runInSW(
        'getObjectStoreEntries',
        'workbox-expiration',
        'cache-entries',
      )
    ).filter((entry) => {
      return entry.cacheName === 'expiration-plugin-deletion';
    });

    expect(entries).to.deep.equal([]);
  });
});
