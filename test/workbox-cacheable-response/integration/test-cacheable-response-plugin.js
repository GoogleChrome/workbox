const expect = require('chai').expect;

const activateAndControlSW = require('../../../infra/testing/activate-and-control');

describe(`cacheableResponse.Plugin`, function() {
  const testServerAddress = global.__workbox.server.getAddress();
  const testingUrl = `${testServerAddress}/test/workbox-cacheable-response/static/cacheable-response-plugin/`;
  const swUrl = `${testingUrl}sw.js`;

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

  before(async function() {
    // Navigate to our test page and clear all caches before this test runs.
    await global.__workbox.webdriver.get(testingUrl);
    await global.__workbox.webdriver.executeAsyncScript((cb) => {
      caches.keys()
        .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
        .then(cb);
    });
  });

  it(`should load a page and cache entries`, async function() {
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
      'cacheable-response-cache',
    ]);

    let cachedRequests = await getCachedRequests(keys[0]);
    expect(cachedRequests).to.deep.equal([
      `${testingUrl}example-1.txt`,
    ]);
  });
});
