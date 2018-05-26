const expect = require('chai').expect;

const activateAndControlSW = require('../../../infra/testing/activate-and-control');
const cleanSWEnv = require('../../../infra/testing/clean-sw');

describe(`expiration.Plugin`, function() {
  const testServerAddress = global.__workbox.server.getAddress();
  const testingUrl = `${testServerAddress}/test/workbox-cache-expiration/static/expiration-plugin/`;

  const getCachedRequests = (cacheName) => {
    return global.__workbox.webdriver.executeAsyncScript((cacheName, cb) => {
      caches.open(cacheName)
      .then((cache) => {
        return cache.keys();
      })
      .then((keys) => {
        cb(
          keys.map((request) => request.url).sort()
        );
      });
    }, cacheName);
  };

  beforeEach(async function() {
    // Navigate to our test page and clear all caches before this test runs.
    await cleanSWEnv(global.__workbox.webdriver, testingUrl);
  });

  it(`should load a page with entries managed by maxEntries`, async function() {
    const swUrl = `${testingUrl}sw-max-entries.js`;

    // Wait for the service worker to register and activate.
    await activateAndControlSW(swUrl);

    await global.__workbox.webdriver.executeAsyncScript((testingUrl, cb) => {
      fetch(`${testingUrl}example-1.txt`).then(() => cb()).catch((err) => cb(err.message));
    }, testingUrl);

    // Caching is done async from returning a response, so we may need
    // to wait before the cache has some content.
    await global.__workbox.webdriver.wait(async () => {
      return await global.__workbox.webdriver.executeAsyncScript((cb) => {
        caches.keys().then((keys) => cb(keys.length > 0));
      });
    });

    const keys = await global.__workbox.webdriver.executeAsyncScript((cb) => {
      caches.keys().then(cb);
    });

    expect(keys).to.deep.equal([
      'expiration-plugin-max-entries',
    ]);

    let cachedRequests = await getCachedRequests(keys[0]);
    expect(cachedRequests).to.deep.equal([
      `${testingUrl}example-1.txt`,
    ]);

    await global.__workbox.webdriver.executeAsyncScript((testingUrl, cb) => {
      fetch(`${testingUrl}example-2.txt`).then(() => cb()).catch((err) => cb(err.message));
    }, testingUrl);

    // Caching is done async from returning a response, so we may need
    // to wait before the cache has be cleaned up.
    let waitForCleanup = true;
    while (waitForCleanup) {
      cachedRequests = await getCachedRequests(keys[0]);
      if (cachedRequests.length !== 1) {
        continue;
      }

      if (cachedRequests[0] !== `${testingUrl}example-2.txt`) {
        continue;
      }

      waitForCleanup = false;
    }

    // If the code path reaches here - the clean up from expiration was
    // successful
  });

  it(`should load a page with entries managed by maxAgeSeconds`, async function() {
    const swUrl = `${testingUrl}sw-max-entries.js`;

    // Load the page and wait for the service worker to register and activate.
    await global.__workbox.webdriver.get(testingUrl);
    await activateAndControlSW(swUrl);

    await global.__workbox.webdriver.executeAsyncScript((testingUrl, cb) => {
      fetch(`${testingUrl}example-1.txt`).then(() => cb()).catch((err) => cb(err.message));
    }, testingUrl);

    // Caching is done async from returning a response, so we may need
    // to wait before the cache has some content.
    await global.__workbox.webdriver.wait(async () => {
      return await global.__workbox.webdriver.executeAsyncScript((cb) => {
        caches.keys().then((keys) => cb(keys.length > 0));
      });
    });

    const keys = await global.__workbox.webdriver.executeAsyncScript((cb) => {
      caches.keys().then(cb);
    });

    expect(keys).to.deep.equal([
      'expiration-plugin-max-entries',
    ]);

    let cachedRequests = await getCachedRequests(keys[0]);
    expect(cachedRequests).to.deep.equal([
      `${testingUrl}example-1.txt`,
    ]);

    // Wait 1.5 seconds to expire entry.
    await new Promise((resolve) => {
      setTimeout(resolve, 1500);
    });

    await global.__workbox.webdriver.executeAsyncScript((testingUrl, cb) => {
      fetch(`${testingUrl}example-2.txt`).then(() => cb()).catch((err) => cb(err.message));
    }, testingUrl);

    // Caching is done async from returning a response, so we may need
    // to wait before the cache has be cleaned up.
    let waitForCleanup = true;
    while (waitForCleanup) {
      cachedRequests = await getCachedRequests(keys[0]);
      if (cachedRequests.length !== 1) {
        continue;
      }

      if (cachedRequests[0] !== `${testingUrl}example-2.txt`) {
        continue;
      }

      waitForCleanup = false;
    }

    // If the code path reaches here - the clean up from expiration was
    // successful
  });

  it(`should clean up when deleteCacheAndMetadata() is called`, async function() {
    const name = 'expiration-plugin-deletion';
    const swUrl = `${testingUrl}sw-deletion.js`;

    // Wait for the service worker to register and activate.
    await activateAndControlSW(swUrl);

    await global.__workbox.webdriver.executeAsyncScript((testingUrl, cb) => {
      fetch(`${testingUrl}example-1.txt`)
        .then(() => cb())
        .catch((err) => cb(err.message));
    }, testingUrl);

    // Caching is done async from returning a response, so we may need
    // to wait until the cache has some content.
    await global.__workbox.webdriver.wait(async () => {
      return await global.__workbox.webdriver.executeAsyncScript((cb) => {
        caches.keys().then((keys) => cb(keys.length > 0));
      });
    });

    let cacheKeys = await global.__workbox.webdriver.executeAsyncScript((cb) => {
      caches.keys().then(cb);
    });

    expect(cacheKeys).to.deep.equal([
      name,
    ]);

    let existence = await global.__workbox.webdriver.executeAsyncScript((cb) => {
      navigator.serviceWorker.addEventListener('message', (event) => {
        cb(event.data);
      }, {once: true});

      navigator.serviceWorker.controller.postMessage('doesDbExist');
    });
    expect(existence).to.be.true;

    const error = await global.__workbox.webdriver.executeAsyncScript((cb) => {
      navigator.serviceWorker.addEventListener('message', (event) => {
        cb(event.data);
      }, {once: true});

      navigator.serviceWorker.controller.postMessage('delete');
    });

    if (error) {
      throw new Error(error);
    }

    // After cleanup, there shouldn't be any cache keys or IndexedDB dbs.
    cacheKeys = await global.__workbox.webdriver.executeAsyncScript((cb) => {
      caches.keys().then(cb);
    });

    expect(cacheKeys).to.deep.equal([]);

    existence = await global.__workbox.webdriver.executeAsyncScript((cb) => {
      navigator.serviceWorker.addEventListener('message', (event) => {
        cb(event.data);
      }, {once: true});

      navigator.serviceWorker.controller.postMessage('doesDbExist');
    });
    expect(existence).to.be.false;
  });
});
