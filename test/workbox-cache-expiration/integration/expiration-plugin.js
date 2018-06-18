const expect = require('chai').expect;

const activateAndControlSW = require('../../../infra/testing/activate-and-control');
const cleanSWEnv = require('../../../infra/testing/clean-sw');
const runInSW = require('../../../infra/testing/comlink/node-interface');
const waitUntil = require('../../../infra/testing/wait-until');

describe(`expiration.Plugin`, function() {
  const baseUrl = `${global.__workbox.server.getAddress()}/test/workbox-cache-expiration/static/expiration-plugin/`;

  beforeEach(async function() {
    // Navigate to our test page and clear all caches before this test runs.
    await cleanSWEnv(global.__workbox.webdriver, `${baseUrl}integration.html`);
  });

  it(`should load a page with entries managed by maxEntries`, async function() {
    const swUrl = `${baseUrl}sw-max-entries.js`;

    // Wait for the service worker to register and activate.
    await activateAndControlSW(swUrl);

    let error = await global.__workbox.webdriver.executeAsyncScript((cb) => {
      fetch(`example-1.txt`).then(() => cb()).catch((err) => cb(err.message));
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
    expect(keys).to.deep.equal([
      'expiration-plugin-max-entries',
    ]);

    let cachedRequests = await runInSW('cacheUrls', keys[0]);
    expect(cachedRequests).to.eql([
      `${baseUrl}example-1.txt`,
    ]);

    error = await global.__workbox.webdriver.executeAsyncScript((cb) => {
      fetch(`example-2.txt`).then(() => cb()).catch((err) => cb(err.message));
    });
    if (error) {
      throw new Error(error);
    }

    // Caching is done async from returning a response, so we may need
    // to wait before the cache has be cleaned up.
    await waitUntil(async () => {
      cachedRequests = await runInSW('cacheUrls', keys[0]);
      return (cachedRequests.length === 1 &&
              cachedRequests[0] === `${baseUrl}example-2.txt`);
    });
  });

  it(`should load a page with entries managed by maxAgeSeconds`, async function() {
    const swUrl = `${baseUrl}sw-max-age-seconds.js`;

    // Wait for the service worker to register and activate.
    await activateAndControlSW(swUrl);

    let error = await global.__workbox.webdriver.executeAsyncScript((cb) => {
      fetch(`example-1.txt`).then(() => cb()).catch((err) => cb(err.message));
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
    expect(keys).to.deep.equal([
      'expiration-plugin-max-age-seconds',
    ]);

    let cachedRequests = await runInSW('cacheUrls', keys[0]);
    expect(cachedRequests).to.eql([
      `${baseUrl}example-1.txt`,
    ]);

    // Wait 2 seconds to expire entry.
    await new Promise((resolve) => {
      setTimeout(resolve, 2000);
    });

    error = await global.__workbox.webdriver.executeAsyncScript((cb) => {
      fetch(`example-2.txt`).then(() => cb()).catch((err) => cb(err.message));
    });
    if (error) {
      throw new Error(error);
    }

    // Caching is done async from returning a response, so we may need
    // to wait before the cache has be cleaned up.
    await waitUntil(async () => {
      cachedRequests = await runInSW('cacheUrls', keys[0]);
      return (cachedRequests.length === 1 &&
              cachedRequests[0] === `${baseUrl}example-2.txt`);
    });
  });

  it(`should clean up when deleteCacheAndMetadata() is called`, async function() {
    const swUrl = `${baseUrl}sw-deletion.js`;

    // Wait for the service worker to register and activate.
    await activateAndControlSW(swUrl);

    let error = await global.__workbox.webdriver.executeAsyncScript((cb) => {
      fetch(`example-1.txt`).then(() => cb()).catch((err) => cb(err.message));
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
    expect(keys).to.deep.equal([
      'expiration-plugin-deletion',
    ]);

    let existence = await runInSW('doesDbExist', 'expiration-plugin-deletion');
    expect(existence).to.be.true;

    error = await global.__workbox.webdriver.executeAsyncScript((cb) => {
      navigator.serviceWorker.addEventListener('message', (event) => {
        cb(event.data);
      }, {once: true});
      navigator.serviceWorker.controller.postMessage('delete');
    });
    if (error) {
      throw new Error(error);
    }

    // After cleanup, there shouldn't be any cache keys or IndexedDB dbs.
    keys = await runInSW('cachesKeys');
    expect(keys).to.deep.equal([]);

    existence = await runInSW('doesDbExist', 'expiration-plugin-deletion');
    expect(existence).to.be.false;
  });
});
